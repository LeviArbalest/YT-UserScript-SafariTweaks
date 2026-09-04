// ==UserScript==
// @name         YouTube Tube Cleaner Lite + Max Quality + Big Icons
// @namespace    ap-utils.ios.youtube.tclite
// @version      1.0
// @description  Native PiP + background playback (Tube Cleaner style), auto max quality, and enlarged player control icons for iOS Safari. No SponsorBlock/DeArrow.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // =========================
  // CONFIG
  // =========================
  const AUTO_PIP_ON_BACKGROUND = true;
  const ICON_SCALE = 1.6; // 1.0 = default, 1.6 = noticeably larger tap targets
  const MAX_QUALITY_ATTEMPTS = 15;
  const QUALITY_CHECK_INTERVAL_MS = 800;

  // =========================
  // STYLE INJECTION (big icons + clean chrome)
  // =========================
  const STYLE_ID = 'tclite-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Hide YouTube's own chrome overlays so native controls dominate */
      .ytp-chrome-bottom, .ytp-gradient-bottom, .ytp-chrome-top,
      .ytp-pause-overlay, .ytp-ce-element, .ytp-ad-text-overlay,
      .ytp-scrubber-container { display: none !important; }

      /* Force native controls visible */
      video::-webkit-media-controls {
        display: flex !important;
        transform-origin: bottom left;
      }

      /* Enlarge control icons (play/pause/volume/etc.) */
      video::-webkit-media-controls-panel,
      video::-webkit-media-controls-play-button,
      video::-webkit-media-controls-mute-button,
      video::-webkit-media-controls-fullscreen-button,
      video::-webkit-media-controls-current-time-display,
      video::-webkit-media-controls-time-remaining-display,
      video::-webkit-media-controls-timeline-container,
      video::-webkit-media-controls-timeline,
      video::-webkit-media-controls-volume-slider-container,
      video::-webkit-media-controls-volume-slider {
        transform: scale(${ICON_SCALE});
      }

      /* Nudge timeline so it doesn't clip after scaling */
      video::-webkit-media-controls-timeline-container {
        margin-left: calc(12px * ${ICON_SCALE});
        margin-right: calc(12px * ${ICON_SCALE});
      }

      /* Keep video filling the player area */
      video {
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      }
    `;
    document.head.appendChild(style);
  }

  // =========================
  // PLAYER HELPERS
  // =========================
  function getPlayer() {
    return document.getElementById('movie_player') ||
           document.querySelector('.html5-video-player');
  }

  function getVideo() {
    return document.querySelector('video');
  }

  function supportsPip(video) {
    return !!video && typeof video.webkitSetPresentationMode === 'function';
  }

  function pipAllowed(video) {
    if (!supportsPip(video)) return false;
    try {
      if (typeof video.webkitSupportsPresentationMode === 'function') {
        return video.webkitSupportsPresentationMode('picture-in-picture');
      }
    } catch (_) {}
    return true;
  }

  function enterPip(video) {
    if (!pipAllowed(video)) return;
    try {
      if (video.webkitPresentationMode !== 'picture-in-picture') {
        video.webkitSetPresentationMode('picture-in-picture');
      }
    } catch (_) {}
  }

  function exitPip(video) {
    if (!pipAllowed(video)) return;
    try {
      if (video.webkitPresentationMode === 'picture-in-picture') {
        video.webkitSetPresentationMode('inline');
      }
    } catch (_) {}
  }

  function togglePip(video) {
    if (!pipAllowed(video)) return;
    if (video.webkitPresentationMode === 'picture-in-picture') {
      exitPip(video);
    } else {
      enterPip(video);
    }
  }

  // =========================
  // AUTO-PIP ON BACKGROUND
  // =========================
  function setupAutoPip() {
    if (!AUTO_PIP_ON_BACKGROUND) return;
    document.addEventListener('visibilitychange', () => {
      const video = getVideo();
      if (!video || video.paused || video.ended) return;
      if (document.visibilityState === 'hidden') {
        enterPip(video);
      }
    }, true);
  }

  // =========================
  // MAX QUALITY LOGIC
  // =========================
  function pickHighest(levels) {
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
      if (attempt < MAX_QUALITY_ATTEMPTS) {
        setTimeout(() => forceMaxQuality(attempt + 1), QUALITY_CHECK_INTERVAL_MS);
      }
      return;
    }

    let levels = [];
    try { levels = player.getAvailableQualityLevels(); } catch (_) {}

    if (!levels.length) {
      if (attempt < MAX_QUALITY_ATTEMPTS) {
        setTimeout(() => forceMaxQuality(attempt + 1), QUALITY_CHECK_INTERVAL_MS);
      }
      return;
    }

    const best = pickHighest(levels);
    try {
      player.setPlaybackQualityRange(best, best);
    } catch (_) {}

    // Re-check a few seconds after start in case YouTube re-negotiates
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

  // =========================
  // INIT
  // =========================
  function enableNativeVideoControls() {
    const video = getVideo();
    if (!video) return;
    video.controls = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
  }

  function init() {
    injectStyle();
    enableNativeVideoControls();
  }

  // SPA navigation hooks
  document.addEventListener('yt-navigate-finish', onNavigate, true);
  document.addEventListener('yt-page-data-updated', onNavigate, true);
  window.addEventListener('load', onNavigate, true);

  setupAutoPip();
  onNavigate();
  init();

  // Re-init on DOM mutations in case YouTube rebuilds the player
  const observer = new MutationObserver(init);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();