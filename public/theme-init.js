(function () {
  try {
    var t = localStorage.getItem('ksd_theme');
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = t === 'light' || t === 'dark' ? t : dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    var l = localStorage.getItem('ksd_lang');
    var lang = l === 'en' || l === 'ar' ? l : 'ar';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  } catch (e) {}
})();
