/* Runs before styles and React so a saved choice applies on the first paint.
   This local file is included in the offline shell. */
(function () {
  var key = 'hkime-theme';
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function valid(value) { return value === 'light' || value === 'dark' ? value : 'system'; }
  var preference = 'system';
  try { preference = valid(localStorage.getItem(key)); } catch (_) {}
  function apply() {
    var resolved = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === 'dark' ? '#1c2521' : '#ffffff';
  }
  function notify() { apply(); window.dispatchEvent(new Event('hkime-theme-change')); }
  window.hkimeTheme = {
    get preference() { return preference; },
    set: function (value) {
      preference = valid(value);
      try { localStorage.setItem(key, preference); } catch (_) {}
      notify();
    }
  };
  media.addEventListener('change', function () { if (preference === 'system') notify(); });
  window.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) { preference = valid(event.newValue); notify(); }
  });
  apply();
}());
