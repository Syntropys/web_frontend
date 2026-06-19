(function () {
  try {
    var stored = localStorage.getItem('agrolytics-theme-v3');
    var theme = 'light';
    if (stored) {
      try {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.state && parsed.state.theme) {
          theme = parsed.state.theme;
        }
      } catch (e) {
        if (stored === 'dark' || stored === 'light') {
          theme = stored;
        }
      }
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0b1215';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#efebe1';
    }
  } catch (e) {
    document.documentElement.style.backgroundColor = '#efebe1';
  }
})();
