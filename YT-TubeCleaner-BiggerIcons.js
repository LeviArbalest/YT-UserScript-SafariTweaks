// ==UserScript==
// @name         Tube Cleaner - Larger Top Player Icons
// @namespace    ap-utils.youtube.tube-cleaner-icons
// @version      1.0
// @description  Enlarges Tube Cleaner's top-edge YouTube player controls: zoom, audio and PiP. Does not change playback, quality, SponsorBlock or other Tube Cleaner features.
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const SCALE = 1.55;
  const TOP_GAP = '10px';
  const STYLE_ID = 'tube-cleaner-big-top-icons';

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Tube Cleaner / custom top player controls */
      .ytp-zoom-button,
      .ytp-button[aria-label*="Zoom" i],
      .ytp-button[title*="Zoom" i],
      .ytp-button[aria-label*="Audio" i],
      .ytp-button[title*="Audio" i],
      .ytp-button[aria-label*="Picture" i],
      .ytp-button[title*="Picture" i],
      [class*="pip" i],
      [id*="pip" i],
      [class*="picture-in-picture" i],
      [id*="picture-in-picture" i] {
        transform: scale(${SCALE}) !important;
        transform-origin: center center !important;
        margin-left: ${TOP_GAP} !important;
        margin-right: ${TOP_GAP} !important;
        position: relative !important;
        z-index: 2147483000 !important;
      }

      /* Keep enlarged icons from being hidden by the player edge */
      .html5-video-player,
      .ytp-player-content,
      .ytp-chrome-top,
      .ytp-chrome-controls {
        overflow: visible !important;
      }

      /* Increase the clickable area without changing the icon graphic */
      .ytp-zoom-button::before,
      .ytp-button[aria-label*="Zoom" i]::before,
      .ytp-button[aria-label*="Audio" i]::before,
      .ytp-button[aria-label*="Picture" i]::before {
        content: "" !important;
        position: absolute !important;
        inset: -7px !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function enlargeCustomControls() {
    const selectors = [
      '[data-tube-cleaner-control]',
      '[data-tube-cleaner-button]',
      '[data-tc-control]',
      '[data-tc-button]',
      '[aria-label*="Zoom" i]',
      '[title*="Zoom" i]',
      '[aria-label*="Audio" i]',
      '[title*="Audio" i]',
      '[aria-label*="Picture-in-picture" i]',
      '[aria-label*="Picture in picture" i]',
      '[title*="Picture-in-picture" i]',
      '[title*="Picture in picture" i]'
    ];

    document.querySelectorAll(selectors.join(',')).forEach((element) => {
      if (element.dataset.tcBigIconApplied === '1') return;
      element.dataset.tcBigIconApplied = '1';
      element.style.setProperty('transform', `scale(${SCALE})`, 'important');
      element.style.setProperty('transform-origin', 'center center', 'important');
      element.style.setProperty('margin-left', TOP_GAP, 'important');
      element.style.setProperty('margin-right', TOP_GAP, 'important');
      element.style.setProperty('z-index', '2147483000', 'important');
    });
  }

  function init() {
    installStyle();
    enlargeCustomControls();
  }

  init();

  const observer = new MutationObserver(init);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener('yt-navigate-finish', init, true);
  document.addEventListener('yt-page-data-updated', init, true);
})();
