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
    { href: 'tools.html',                   label: 'Tools'      }
  ];

  /* ── sidebars ──────────────────────────────────────────────
     Each section of the site owns its own menu. The academy is
     standalone: its sidebar lists lessons only, no tools.       */

  /* numbering restarts inside each category */
  var ACADEMY_SIDEBAR = [
    { head: 'Start here', links: [
      { href: 'academy.html',       label: 'Overview',       num: ''   }
    ]},
    { head: '8B GreekZones', links: [
      { href: 'greekzones.html',    label: 'Overview',       num: '01' },
      { href: '01-gamma.html',      label: 'Gamma',          num: '02' },
      { href: '02-vanna.html',      label: 'Vanna',          num: '03' },
      { href: '03-charm.html',      label: 'Charm',          num: '04' },
      { href: '04-levels.html',     label: 'The Levels',     num: '05' },
      { href: '05-plays.html',      label: 'The Plays',      num: '06' }
    ]},
    { head: '8B BattleZones', links: [
      { href: 'battlezones.html',   label: 'Overview',       num: '01' }
    ]},
    { head: 'Entry models', links: [
      { href: 'entry-models.html',  label: 'Overview',              num: '01' },
      { href: 'entry-tier-1.html',  label: 'Tier 1 · Beginner',     num: '02' },
      { href: 'entry-tier-2.html',  label: 'Tier 2 · Intermediate', num: '03' },
      { href: 'entry-tier-3.html',  label: 'Tier 3 · Advanced',     num: '04' }
    ]}
  ];

  var TOOLS_SIDEBAR = [
    { head: 'Tools', links: [
      { href: 'tools.html',         label: 'All tools',      num: ''   },
      { href: '07-playbook.html',   label: 'The Edge',       num: '01' }
    ]}
  ];

  /* indicators page — one entry per published script, jumping to its
     card. Prefers window.IND_DATA (set by 06-indicators.html from the
     same array it renders the grid with). Falls back to reading the
     rendered cards, so a stale cached copy of either file still gives
     a populated menu instead of an empty heading. */
  function indicatorsSidebar() {
    var data = window.IND_DATA;
    if (!data || !data.length) {
      data = [].slice.call(document.querySelectorAll('.ind-card')).map(function (el, i) {
        var title = el.querySelector('.ind-title');
        var name = title ? title.textContent.replace(/^\s*\[8B\]\s*/, '').trim() : 'Indicator ' + (i + 1);
        return { slug: (el.id || '').replace(/^ind-/, ''), name: name, el: el };
      });
    }
    var items = data.map(function (d, i) {
      var slug = d.slug;
      if (!slug) {                       /* cached markup with no id — mint one */
        slug = 'card-' + (i + 1);
        if (d.el) d.el.id = 'ind-' + slug;
      }
      return {
        href: '#ind-' + slug,
        label: d.name,
        num: ('0' + (i + 1)).slice(-2),
        compact: true
      };
    });
    return [{ head: 'Indicators', links: items }];
  }

  var TOOLS_PAGES = ['tools.html', '07-playbook.html'];

  var section = file === '06-indicators.html' ? 'indicators'
              : TOOLS_PAGES.indexOf(file) !== -1 ? 'tools'
              : 'academy';

  function groups() {
    return section === 'indicators' ? indicatorsSidebar()
         : section === 'tools'      ? TOOLS_SIDEBAR
         : ACADEMY_SIDEBAR;
  }

  /* which topbar link is "current" for this page */
  var navActive = section === 'indicators' ? 'Indicators'
                : section === 'tools'      ? 'Tools'
                : 'Academy';

  function build() {
    /* 0 — resolve the menu FIRST: step 1 moves the page content into a
       detached node, after which the DOM fallback could not see it */
    var GROUPS = groups();

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
      '<div class="topbar-right">' +
        '<div class="nav-links">' + links + '</div>' +
        '<div class="fs-ctl" role="group" aria-label="Text size">' +
          '<button class="fs-btn" type="button" data-fs="-1" aria-label="Decrease text size">A&minus;</button>' +
          '<button class="fs-btn fs-reset" type="button" aria-label="Reset text size to default">100%</button>' +
          '<button class="fs-btn" type="button" data-fs="1" aria-label="Increase text size">A+</button>' +
        '</div>' +
        '<button class="menu-btn" type="button" aria-label="Toggle academy menu" aria-expanded="false">☰</button>' +
      '</div>';

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
        var compact = l.compact ? ' sb-compact' : '';
        var num = l.num ? '<span class="sb-num">' + l.num + '</span>' : '<span class="sb-num"></span>';
        return '<a class="sb-link' + compact + active + '" href="' + l.href + '">' + num + l.label + '</a>';
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

    /* 5 — text size control. Everything in academy.css is sized in px,
       so a root font-size change would do nothing; we scale the content
       column instead and persist the choice across pages. */
    var STEPS = [0.9, 1, 1.1, 1.25, 1.45];
    var DEFAULT_STEP = 1;
    var STORE = '8bt-fs';

    function readStep() {
      var v = null;
      try { v = localStorage.getItem(STORE); } catch (e) { /* private mode */ }
      var n = parseInt(v, 10);
      return (isNaN(n) || n < 0 || n >= STEPS.length) ? DEFAULT_STEP : n;
    }
    var step = readStep();

    function applyStep() {
      doc.style.setProperty('--fs-zoom', STEPS[step]);
      var pct = Math.round(STEPS[step] * 100) + '%';
      var label = topbar.querySelector('.fs-reset');
      label.textContent = pct;
      label.setAttribute('aria-label', 'Text size ' + pct + ' — click to reset to default');
      topbar.querySelector('[data-fs="-1"]').disabled = step === 0;
      topbar.querySelector('[data-fs="1"]').disabled = step === STEPS.length - 1;
      try { localStorage.setItem(STORE, String(step)); } catch (e) { /* ignore */ }
    }

    topbar.querySelector('.fs-ctl').addEventListener('click', function (e) {
      var b = e.target.closest('.fs-btn');
      if (!b) return;
      if (b.classList.contains('fs-reset')) step = DEFAULT_STEP;
      else step = Math.min(STEPS.length - 1, Math.max(0, step + Number(b.dataset.fs)));
      applyStep();
    });
    applyStep();

    /* 6 — mobile drawer */
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
