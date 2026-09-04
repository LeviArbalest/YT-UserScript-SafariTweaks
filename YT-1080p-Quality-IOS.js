
// ==UserScript==
// @name         YouTube Prefer 1080p / 1080p60 (iOS Safari)
// @namespace    leviarbalest.youtube.prefer-1080p
// @version      1.0
// @description  Prefers 1080p (including 1080p60 when available). Falls back to the highest available quality below 1080p. Does not automatically select 1440p/4K.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PREFERRED_QUALITY = 'hd1080';
  const MAX_ATTEMPTS = 18;
  const RETRY_MS = 800;

  function getPlayer() {
    return document.getElementById('movie_player') ||
      document.querySelector('.html5-video-player');
  }

  function chooseQuality(levels) {
    if (!Array.isArray(levels) || levels.length === 0) return null;

    // Use 1080p whenever YouTube offers it.
    if (levels.includes(PREFERRED_QUALITY)) {
      return PREFERRED_QUALITY;
    }

    // If 1080p is unavailable, use the best quality BELOW 1080p.
    // This deliberately ignores hd1440, hd2160 and highres so that
    // those stay available for your manual selection.
    const fallbackOrder = [
      'hd720',
      'large',
      'medium',
      'small',
      'tiny'
    ];

    return fallbackOrder.find((quality) => levels.includes(quality)) || null;
  }

  function applyPreferredQuality(attempt = 0) {
    const player = getPlayer();

    if (!player || typeof player.getAvailableQualityLevels !== 'function') {
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => applyPreferredQuality(attempt + 1), RETRY_MS);
      }
      return;
    }

    let levels = [];

    try {
      levels = player.getAvailableQualityLevels();
    } catch (_) {
      levels = [];
    }

    const selectedQuality = chooseQuality(levels);

    if (!selectedQuality) {
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => applyPreferredQuality(attempt + 1), RETRY_MS);
      }
      return;
    }

    try {
      // Restricts automatic selection to exactly the chosen quality.
      player.setPlaybackQualityRange(selectedQuality, selectedQuality);

      // Helpful fallback for player versions that still expose this method.
      if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(selectedQuality);
      }
    } catch (_) {}

    // YouTube may briefly start at Auto/360p before its full quality list appears.
    // Reapply after initial stream negotiation.
    if (attempt === 0) {
      setTimeout(() => applyPreferredQuality(1), 2500);
      setTimeout(() => applyPreferredQuality(1), 5000);
    }
  }

  function onNewVideo() {
    applyPreferredQuality();
  }

  document.addEventListener('yt-navigate-finish', onNewVideo, true);
  document.addEventListener('yt-page-data-updated', onNewVideo, true);
  window.addEventListener('load', onNewVideo, true);

  const observer = new MutationObserver(() => {
    if (document.querySelector('video')) {
      applyPreferredQuality();
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  onNewVideo();
})();
