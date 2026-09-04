// ==UserScript==
// @name         YouTube Force Max Quality (Companion to Tube Cleaner)
// @namespace    ap-utils.ios.youtube.maxquality
// @version      1.0
// @description  Forces YouTube's HTML5 player to the highest available resolution on every video load and SPA navigation, fixing the "stuck on Auto/360p" issue. Run alongside wBlock's Tube Cleaner, not as a replacement.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const CHECK_INTERVAL_MS = 800;
  const MAX_ATTEMPTS = 15;

  function getPlayer() {
    return document.getElementById('movie_player') ||
           document.querySelector('.html5-video-player');
  }

  function pickHighest(levels) {
    // getAvailableQualityLevels() returns levels sorted best-to-worst,
    // but we still explicitly rank to be safe across YouTube player versions.
    const order = [
      'highres', 'hd2160', 'hd1440', 'hd1080', 'hd720',
      'large', 'medium', 'small', 'tiny', 'auto'
    ];
    const ranked = levels.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return ranked[0];
  }

  function forceMaxQuality(attempt = 0) {
    const player = getPlayer();
    if (!player || typeof player.getAvailableQualityLevels !== 'function') {
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => forceMaxQuality(attempt + 1), CHECK_INTERVAL_MS);
      }
      return;
    }

    let levels = [];
    try { levels = player.getAvailableQualityLevels(); } catch (_) {}

    if (!levels.length) {
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => forceMaxQuality(attempt + 1), CHECK_INTERVAL_MS);
      }
      return;
    }

    const best = pickHighest(levels);
    try {
      player.setPlaybackQualityRange(best, best);
    } catch (_) {}

    // Re-check once playback actually starts, since YouTube sometimes
    // re-negotiates quality a few seconds after the initial load.
    if (attempt === 0) {
      setTimeout(() => forceMaxQuality(1), 3000);
    }
  }

  function hookPlayerEvents() {
    const player = getPlayer();
    if (!player || typeof player.addEventListener !== 'function') return;
    try {
      player.addEventListener('onStateChange', () => forceMaxQuality());
    } catch (_) {}
  }

  function onNavigate() {
    forceMaxQuality();
    setTimeout(hookPlayerEvents, 1000);
  }

  document.addEventListener('yt-navigate-finish', onNavigate, true);
  document.addEventListener('yt-page-data-updated', onNavigate, true);
  window.addEventListener('load', onNavigate, true);

  onNavigate();
})();
