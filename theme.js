/* Obiverse Theme System — dark / light / system
   Loaded in <head> with blocking script to prevent flash.
   Cycles: system → dark → light → system
   Persists to localStorage('obi-theme') */

(function () {
  var STORAGE_KEY = 'obi-theme';
  var root = document.documentElement;

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(mode) {
    var resolved = mode === 'system' ? getSystemTheme() : mode;
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-setting', mode);
  }

  // Apply immediately (before paint)
  var stored = localStorage.getItem(STORAGE_KEY) || 'system';
  applyTheme(stored);

  // Listen for system changes when in system mode
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () {
    if ((localStorage.getItem(STORAGE_KEY) || 'system') === 'system') {
      applyTheme('system');
    }
  });

  // Expose toggle for buttons
  window.obiThemeCycle = function () {
    var current = localStorage.getItem(STORAGE_KEY) || 'system';
    var next = current === 'system' ? 'dark' : current === 'dark' ? 'light' : 'system';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    updateToggleIcons();
  };

  // Update all toggle buttons on the page
  window.updateToggleIcons = function () {
    var setting = root.getAttribute('data-theme-setting') || 'system';
    var icons = document.querySelectorAll('.theme-icon');
    for (var i = 0; i < icons.length; i++) {
      // ◐ system, ● dark, ○ light
      icons[i].textContent = setting === 'system' ? '\u25D0' : setting === 'dark' ? '\u25CF' : '\u25CB';
      icons[i].title = setting === 'system' ? 'Theme: System' : setting === 'dark' ? 'Theme: Dark' : 'Theme: Light';
    }
  };

  // Run updateToggleIcons once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateToggleIcons);
  } else {
    updateToggleIcons();
  }
})();
