(function () {
  var p = window.location.pathname;
  if (p !== '/' && p !== '') {
    var sk = document.getElementById('__skeleton__');
    if (sk) sk.style.display = 'none';
    var root = document.getElementById('root');
    if (root) {
      var isDark = document.documentElement.classList.contains('dark');
      var bg = isDark ? '#0b1215' : '#efebe1';
      var fg = isDark ? '#b8bfb9' : '#5f6a64';
      root.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:' + bg + ';"><div style="display:flex;align-items:center;gap:12px;color:' + fg + ';"><svg style="animation:spin 1s linear infinite;width:20px;height:20px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/><path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg><span style="font-size:14px;font-family:Inter,system-ui,sans-serif;">Memuat…</span></div></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
    }
  }
})();
