/* landing mobile menu — full-screen overlay */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;

  function set(open) {
    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function () {
    set(!document.body.classList.contains('nav-open'));
  });

  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') set(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') set(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 720) set(false);
  });
})();
