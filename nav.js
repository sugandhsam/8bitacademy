/* landing mobile menu — full-screen overlay.

   The panel is moved to <body> while it is open. A fixed element is
   positioned against its nearest filtered/transformed ancestor rather than
   the viewport, and the nav bar carries a backdrop-filter once scrolled —
   which pinned the panel inside the ~70px bar. Reparenting sidesteps that
   entirely, whatever gets added to the bar later. */
(function () {
  var btn = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');
  var nav = document.getElementById('nav');
  if (!btn || !menu || !nav) return;

  var open = false;

  function set(next) {
    if (next === open) return;
    open = next;

    if (open) {
      document.body.appendChild(menu);
    } else if (menu.parentNode !== nav) {
      nav.appendChild(menu);
    }

    document.body.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function () { set(!open); });

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
