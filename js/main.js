/**
 * main.js — Application entry point.
 * Imports each isolated module and boots it once the DOM is ready.
 */

import { initDashboard } from './dashboard.js';
import {
  initTheme, initScrollChrome, initMobileMenu, initReveal, initCounters,
  initPricing, initAccordion, initToasts, initForm, initCommandPalette, initMisc,
} from './ui.js';

const boot = () => {
  // Chrome / global UI
  initTheme();
  initScrollChrome();
  initMobileMenu();
  initReveal();
  initCounters();
  initPricing();
  initAccordion();
  initToasts();
  initForm();
  initCommandPalette();
  initMisc();

  // The star of the show
  initDashboard();

  // Friendly console signature for curious engineers / reviewers.
  console.log(
    '%cHelios Analytics %c— built from scratch, no frameworks. Press ⌘K / Ctrl+K.',
    'font-weight:700;color:#8b5cf6', 'color:#22d3ee'
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
