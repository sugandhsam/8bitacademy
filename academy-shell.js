/* ============================================================
   academy-shell.js — docs shell for all academy pages.
   Injects the constant site topbar (same links as the landing
   nav) + the left sidebar menu, and wraps the page's own
   content in the .doc column. Adding a lesson = one entry in
   GROUPS below; no per-page markup to maintain.
   Load with: <script src="academy-shell.js" defer></script>
   ============================================================ */
(function () {
  'use strict';

  var file = location.pathname.split('/').pop() || 'index.html';

  /* constant site nav — must mirror the landing nav exactly */
  var NAV = [
    { href: 'academy.html',                 label: 'Academy'    },
    { href: '06-indicators.html',           label: 'Indicators' },
    { href: 'https://discord.gg/usRSrWm7',  label: 'Community', ext: true },
    { href: '07-playbook.html',             label: 'The Edge'   }
  ];

  /* sidebar menu — the academy map */
  var GROUPS = [
    { head: 'Start here', links: [
      { href: 'academy.html',       label: 'Overview',       num: ''   }
    ]},
    { head: 'The greeks', links: [
      { href: '01-gamma.html',      label: 'Gamma',          num: '01' },
      { href: '02-vanna.html',      label: 'Vanna',          num: '02' },
      { href: '03-charm.html',      label: 'Charm',          num: '03' }
    ]},
    { head: 'The system', links: [
      { href: '04-levels.html',     label: 'The Levels',     num: '04' },
      { href: '05-plays.html',      label: 'The Plays',      num: '05' }
    ]},
    { head: 'Tools', links: [
      { href: '06-indicators.html', label: 'Indicators',     num: '06' },
      { href: '07-playbook.html',   label: 'The Playbook',   num: '07' }
    ]}
  ];

  /* which topbar link is "current" for this page */
  var navActive = file === '06-indicators.html' ? 'Indicators'
                : file === '07-playbook.html'   ? 'The Edge'
                : 'Academy';

  function build() {
    /* 1 — lift the page's own content into the .doc column */
    var doc = document.createElement('main');
    doc.className = 'doc';
    while (document.body.firstChild) doc.appendChild(document.body.firstChild);

    /* 2 — topbar */
    var topbar = document.createElement('nav');
    topbar.className = 'topbar';
    var links = NAV.map(function (l) {
      var active = l.label === navActive ? ' class="active"' : '';
      var ext = l.ext ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + l.href + '"' + active + ext + '>' + l.label + '</a>';
    }).join('');
    topbar.innerHTML =
      '<a class="wordmark" href="index.html">8bit <span>trading</span></a>' +
      '<div class="nav-links">' + links + '</div>' +
      '<button class="menu-btn" type="button" aria-label="Toggle academy menu" aria-expanded="false">☰</button>';

    /* 3 — sidebar */
    var sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    /* phones hide the topbar links — surface the site nav in the drawer */
    var siteGroup = '<div class="sb-group sb-site"><div class="sb-head">Site</div>' +
      NAV.map(function (l) {
        var ext = l.ext ? ' target="_blank" rel="noopener"' : '';
        return '<a class="sb-link" href="' + l.href + '"' + ext + '><span class="sb-num"></span>' + l.label + '</a>';
      }).join('') + '</div>';
    sidebar.innerHTML = siteGroup + GROUPS.map(function (g) {
      var items = g.links.map(function (l) {
        var active = l.href === file ? ' active' : '';
        var num = l.num ? '<span class="sb-num">' + l.num + '</span>' : '<span class="sb-num"></span>';
        return '<a class="sb-link' + active + '" href="' + l.href + '">' + num + l.label + '</a>';
      }).join('');
      return '<div class="sb-group"><div class="sb-head">' + g.head + '</div>' + items + '</div>';
    }).join('');

    /* 4 — mobile overlay */
    var overlay = document.createElement('div');
    overlay.className = 'sb-overlay';

    document.body.appendChild(topbar);
    document.body.appendChild(sidebar);
    document.body.appendChild(overlay);
    document.body.appendChild(doc);

    /* 5 — mobile drawer */
    var btn = topbar.querySelector('.menu-btn');
    function setMenu(open) {
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () {
      setMenu(!document.body.classList.contains('menu-open'));
    });
    overlay.addEventListener('click', function () { setMenu(false); });
    sidebar.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
