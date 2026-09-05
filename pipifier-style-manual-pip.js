// ==UserScript==
// @name         PiPifier-Style PiP — Outside Player, Middle Left
// @namespace    leviarbalest.pipifier.outside-player-button
// @version      1.1
// @description  A movable-overlay-style PiP button positioned just outside the active video at its middle-left edge. It never becomes a child of the player, avoiding YouTube/Tube Cleaner touch overlays.
// @match        *://*/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const BUTTON_ID = 'pipifier-outside-player-button';
  const STYLE_ID = 'pipifier-outside-player-style';
  const HIDE_AFTER_MS = 3000;
  const OUTSIDE_GAP_PX = 8;
  const BUTTON_SIZE_PX = 34;

  let activeVideo = null;
  let button = null;
  let hideTimer = null;
  let positionTimer = null;

  function getTargetVideo() {
    const videos = Array.from(document.querySelectorAll('video')).filter((video) => {
      const rect = video.getBoundingClientRect();
      const style = getComputedStyle(video);
      return rect.width > 80 && rect.height > 50 && style.display !== 'none' && style.visibility !== 'hidden';
    });

    if (!videos.length) return null;

    return videos.find((video) => !video.paused && !video.ended && video.readyState >= 2) ||
      videos.reduce((largest, current) => {
        const a = largest.getBoundingClientRect();
        const b = current.getBoundingClientRect();
        return b.width * b.height > a.width * a.height ? current : largest;
      });
  }

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BUTTON_ID} {
        position: fixed !important;
        width: ${BUTTON_SIZE_PX}px !important;
        height: ${BUTTON_SIZE_PX}px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 1px solid rgba(255,255,255,0.42) !important;
        border-radius: 14px !important;
        background: rgba(0,0,0,0.82) !important;
        color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
        font-size: 28px !important;
        line-height: 1 !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
        touch-action: manipulation !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-tap-highlight-color: transparent !important;
        z-index: 2147483647 !important;
        transform: none !important;
        transition: opacity 160ms ease, visibility 160ms ease !important;
      }
      #${BUTTON_ID}.pipifier-visible {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }
      #${BUTTON_ID}:active {
        background: rgba(75,75,75,1) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function positionButton() {
    if (!button) return;

    const video = getTargetVideo();
    if (!video) return;
    activeVideo = video;

    const rect = video.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportWidth = visualViewport ? visualViewport.width : window.innerWidth;
    const viewportHeight = visualViewport ? visualViewport.height : window.innerHeight;

    // Position outside the left boundary; if that would leave it off-screen,
    // pin it to the left safe edge while staying vertically centred on the video.
    let left = rect.left - BUTTON_SIZE_PX - OUTSIDE_GAP_PX;
    let top = rect.top + (rect.height / 2) - (BUTTON_SIZE_PX / 2);

    left = Math.max(6, Math.min(left, viewportWidth - BUTTON_SIZE_PX - 6));
    top = Math.max(6, Math.min(top, viewportHeight - BUTTON_SIZE_PX - 6));

    button.style.setProperty('left', `${Math.round(left)}px`, 'important');
    button.style.setProperty('top', `${Math.round(top)}px`, 'important');
  }

  function showButton() {
    if (!button) return;
    positionButton();
    button.classList.add('pipifier-visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (button) button.classList.remove('pipifier-visible');
    }, HIDE_AFTER_MS);
  }

  function togglePiP(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const video = activeVideo || getTargetVideo();
    if (video && typeof video.webkitSetPresentationMode === 'function') {
      try {
        video.webkitSetPresentationMode(
          video.webkitPresentationMode === 'picture-in-picture'
            ? 'inline'
            : 'picture-in-picture'
        );
      } catch (_) {}
    }

    showButton();
    return false;
  }

  function bindWakeEvents() {
    if (document.documentElement.dataset.pipifierOutsideWakeBound === '1') return;
    document.documentElement.dataset.pipifierOutsideWakeBound = '1';

    const wakeIfInsideVideo = (event) => {
      const video = getTargetVideo();
      if (!video) return;

      const rect = video.getBoundingClientRect();
      const point = event.touches ? event.touches[0] : event;
      if (!point) return;

      if (point.clientX >= rect.left && point.clientX <= rect.right &&
          point.clientY >= rect.top && point.clientY <= rect.bottom) {
        activeVideo = video;
        showButton();
      }
    };

    // Document capture phase sees touches even when YouTube consumes them.
    document.addEventListener('touchstart', wakeIfInsideVideo, { capture: true, passive: true });
    document.addEventListener('pointerdown', wakeIfInsideVideo, { capture: true, passive: true });
    document.addEventListener('click', wakeIfInsideVideo, { capture: true, passive: true });
  }

  function mount() {
    installStyle();

    if (!button) {
      button = document.createElement('button');
      button.id = BUTTON_ID;
      button.type = 'button';
      button.textContent = '⧉';
      button.setAttribute('aria-label', 'Picture in Picture');
      button.setAttribute('title', 'Picture in Picture');

      button.addEventListener('touchend', togglePiP, { capture: true, passive: false });
      button.addEventListener('pointerup', togglePiP, { capture: true, passive: false });
      button.addEventListener('click', togglePiP, { capture: true, passive: false });
      document.body.appendChild(button);
    }

    bindWakeEvents();
    positionButton();
  }

  function schedulePosition() {
    clearTimeout(positionTimer);
    positionTimer = setTimeout(positionButton, 30);
  }

  mount();
  window.addEventListener('load', () => setTimeout(mount, 300), true);
  window.addEventListener('resize', schedulePosition, { passive: true });
  window.addEventListener('scroll', schedulePosition, { passive: true, capture: true });
  window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true });
  document.addEventListener('fullscreenchange', () => setTimeout(mount, 100), true);
  document.addEventListener('yt-navigate-finish', () => setTimeout(mount, 300), true);
  document.addEventListener('yt-page-data-updated', () => setTimeout(mount, 300), true);

  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      mount();
      positionButton();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
