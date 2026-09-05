// ==UserScript==
// @name Tube Cleaner — Sized Controls Edition
// @namespace com.skula.wblock.modified
// @version 0.1.33-sized-controls
// @description Uploaded Tube Cleaner with primary controls enlarged 10% and Quality/SponsorBlock controls reduced 15%.
// @match https://www.youtube.com/*
// @match https://youtube.com/*
// @match https://m.youtube.com/*
// @match https://music.youtube.com/*
// @match https://www.youtube-nocookie.com/*
// @match https://youtube-nocookie.com/*
// @run-at document-start
// @inject-into page
// @grant none
// ==/UserScript==

(function () {
'use strict';

// This companion override is intended to run AFTER the official Tube Cleaner
// file. It only changes the controls that Tube Cleaner creates and leaves
// playback, quality logic, PiP, captions, chapters, ads and SponsorBlock
// behavior untouched.
var STYLE_ID = 'wblock-tc-sized-controls-override';

function install() {
  if (document.getElementById(STYLE_ID)) return;
  var style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = [
    // Primary playback/caption/speed/fullscreen/audio controls: +10%.
    '.wblock-tc-toolbar .wblock-tc-playback-row button,',
    '.wblock-tc-toolbar .wblock-tc-services-row button:not(.wblock-tc-quality-button):not(.wblock-tc-sponsor-button)',
    '{ transform: scale(1.10) !important; transform-origin: center center !important; }',

    // Quality and SponsorBlock: -15%.
    '.wblock-tc-toolbar .wblock-tc-quality-button,',
    '.wblock-tc-toolbar .wblock-tc-sponsor-button',
    '{ transform: scale(0.85) !important; transform-origin: center center !important; }',

    // Keep the enlarged controls from being clipped by the toolbar.
    '.wblock-tc-toolbar, .wblock-tc-toolbar *',
    '{ overflow: visible !important; }'
  ].join(' ');
  (document.head || document.documentElement).appendChild(style);
}

function applyInline() {
  document.querySelectorAll('.wblock-tc-toolbar .wblock-tc-playback-row button, .wblock-tc-toolbar .wblock-tc-services-row button:not(.wblock-tc-quality-button):not(.wblock-tc-sponsor-button)').forEach(function (el) {
    el.style.setProperty('transform', 'scale(1.10)', 'important');
    el.style.setProperty('transform-origin', 'center center', 'important');
  });
  document.querySelectorAll('.wblock-tc-toolbar .wblock-tc-quality-button, .wblock-tc-toolbar .wblock-tc-sponsor-button').forEach(function (el) {
    el.style.setProperty('transform', 'scale(0.85)', 'important');
    el.style.setProperty('transform-origin', 'center center', 'important');
  });
}

function init() {
  install();
  applyInline();
}

init();
new MutationObserver(function () { requestAnimationFrame(init); })
  .observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('yt-navigate-finish', init, true);
document.addEventListener('yt-page-data-updated', init, true);
})();
