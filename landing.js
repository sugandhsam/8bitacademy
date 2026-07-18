/* 8BITTRADING landing — boot sequence, scroll choreography, sound, score, konami.
   GSAP + ScrollTrigger are globals (vendored UMD); terrain is an ES module. */

import { createTerrain } from './terrain.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// test hook: ?solo=<section-id> shows one section unscrolled (headless capture aid)
const solo = new URLSearchParams(location.search).get('solo');
if (solo) {
  ['hero', 'pitch', 'worlds', 'powerups', 'gameover']
    .filter((s) => s !== solo)
    .forEach((s) => { const el = document.getElementById(s); if (el) el.style.display = 'none'; });
}
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

document.documentElement.classList.remove('no-js');
if (reduced) document.documentElement.classList.add('reduced');

if (!reduced) {
  gsap.registerPlugin(ScrollTrigger);
}

/* ---------------- sound (WebAudio synth — no audio assets) ---------------- */
const sound = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('8bt-sound') === '1';

  const ensure = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const tone = (freq, dur, { type = 'square', gain = 0.035, when = 0, slide = 0 } = {}) => {
    if (!enabled) return;
    const c = ensure();
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  };

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      localStorage.setItem('8bt-sound', enabled ? '1' : '0');
      if (enabled) this.coin();
      return enabled;
    },
    blip() { tone(1150, 0.045); },
    click() { tone(760, 0.06); tone(1520, 0.05, { when: 0.05 }); },
    coin() { tone(987, 0.09, { gain: 0.05 }); tone(1318, 0.28, { gain: 0.05, when: 0.09 }); },
    collect() { tone(880, 0.06); tone(1174, 0.06, { when: 0.06 }); tone(1568, 0.12, { when: 0.12 }); },
    fanfare() {
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) =>
        tone(f, 0.11, { gain: 0.05, when: i * 0.09 }));
    },
  };
})();

const soundBtn = $('#sound');
const paintSoundBtn = () => {
  soundBtn.setAttribute('aria-pressed', String(sound.enabled));
  soundBtn.textContent = sound.enabled ? '♪ ON' : '♪ OFF';
};
soundBtn.addEventListener('click', () => { sound.toggle(); paintSoundBtn(); });
paintSoundBtn();

/* ---------------- score ---------------- */
let bonus = 0;
const scoreEl = $('#score');
const youScoreEl = $('#you-score');
const fmt = (n) => String(Math.max(0, Math.floor(n))).padStart(6, '0');

function paintScore() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const p = max > 0 ? window.scrollY / max : 0;
  const total = Math.floor((p * 7500) / 50) * 50 + bonus;
  scoreEl.textContent = fmt(total);
  if (youScoreEl) youScoreEl.textContent = fmt(total);
}
let scoreTick = false;
window.addEventListener('scroll', () => {
  if (scoreTick) return;
  scoreTick = true;
  requestAnimationFrame(() => { paintScore(); scoreTick = false; });
}, { passive: true });
paintScore();

function addBonus(n) {
  bonus += n;
  paintScore();
}

/* ---------------- terrain ---------------- */
const terrain = createTerrain($('#terrain'), { animate: !reduced });
if (terrain && reduced) terrain.setProgress(0.35);

/* ---------------- boot sequence ---------------- */
const BIOS_LINES = [
  ['8BT SYSTEM BIOS v2.6 — 64K OK', ''],
  ['CHECKING GAMMA ........ ', 'OK'],
  ['LOADING DEALER FLOWS .. ', 'OK'],
  ['CHARM CLOCK ........... ', 'SYNCED'],
  ['INSERT COIN', 'gold'],
];

function heroEntrance(fast = false) {
  const d = fast ? 0.5 : 1;
  const tl = gsap.timeline();
  tl.set('.hero .rv', { visibility: 'visible' })
    .from('.hero-tag', { autoAlpha: 0, duration: 0.3 * d, ease: 'steps(3)' })
    .from('h1.title span', {
      autoAlpha: 0, y: 24, duration: 0.36 * d, stagger: 0.14 * d, ease: 'steps(4)',
    }, '-=0.1')
    .from('.hero-sub', { autoAlpha: 0, duration: 0.3 * d, ease: 'steps(3)' }, '-=0.05')
    .from('.coin-cue', { autoAlpha: 0, y: 10, duration: 0.3 * d, ease: 'steps(3)' }, '-=0.1')
    .from('.hud, #sound', { autoAlpha: 0, duration: 0.25 * d, ease: 'steps(2)' }, '<');
  return tl;
}

function runBoot() {
  const boot = $('#boot');
  if (new URLSearchParams(location.search).has('noboot')) {
    boot.remove();
    gsap.set('.hero .rv, .hud, #sound', { visibility: 'visible', autoAlpha: 1 });
    return;
  }
  if (reduced || !boot) {
    if (boot) boot.remove();
    gsap.set('.hero .rv, .hud, #sound', { visibility: 'visible', autoAlpha: 1 });
    return;
  }

  const seen = sessionStorage.getItem('8bt-booted');
  if (seen) {
    const tl = gsap.timeline();
    tl.to(boot, { autoAlpha: 0, duration: 0.28, ease: 'steps(3)' })
      .add(() => boot.remove())
      .add(heroEntrance(true), '-=0.05');
    return;
  }

  const bios = $('.bios', boot);
  bios.innerHTML = BIOS_LINES.map(([l, s]) => {
    const status = s === 'gold' ? '' : s ? `<span class="ok">${s}</span>` : '';
    const cls = s === 'gold' ? ' class="gold blink"' : '';
    return `<div style="opacity:0"${cls}>${l}${status}</div>`;
  }).join('');

  const tl = gsap.timeline({
    onComplete: () => {
      sessionStorage.setItem('8bt-booted', '1');
      boot.remove();
    },
  });

  tl.to('.beam', { scaleX: 1, duration: 0.14, ease: 'steps(4)' })
    .to('.beam', { autoAlpha: 0, duration: 0.1 }, '+=0.06')
    .to(bios, { opacity: 1, duration: 0.01 })
    .to(bios.children, { opacity: 1, duration: 0.04, stagger: 0.14, ease: 'steps(1)' })
    .to(bios, { autoAlpha: 0, duration: 0.12, ease: 'steps(2)' }, '+=0.35')
    .set('.splash', { opacity: 1 })
    .fromTo('.splash', { scale: 0.92 }, { scale: 1, duration: 0.18, ease: 'steps(3)' })
    .to('.splash', { opacity: 0.2, duration: 0.05, yoyo: true, repeat: 3 }, '+=0.15')
    .to(boot, { autoAlpha: 0, duration: 0.2, ease: 'steps(4)' }, '+=0.1')
    .add(heroEntrance(), '-=0.1');

  // skippable: any input jumps to the end of the boot portion
  const skip = () => { tl.progress(1); cleanup(); };
  const cleanup = () => {
    window.removeEventListener('pointerdown', skip);
    window.removeEventListener('keydown', skip);
    window.removeEventListener('wheel', skip);
  };
  window.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, { once: true });
  window.addEventListener('wheel', skip, { once: true, passive: true });
  tl.eventCallback('onComplete', () => {
    sessionStorage.setItem('8bt-booted', '1');
    if (boot.parentNode) boot.remove();
    cleanup();
  });
}

// hold boot start for fonts, but never longer than 700ms
Promise.race([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise((r) => setTimeout(r, 700)),
]).then(runBoot);

/* ---------------- scroll choreography ---------------- */
if (!reduced && !solo) {
  // terrain camera scrub across hero + pitch
  if (terrain) {
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      endTrigger: '.pitch',
      end: 'bottom top',
      scrub: 0.6,
      onUpdate: (self) => terrain.setProgress(self.progress),
    });
    // fade the set-piece down once the worlds take the stage
    gsap.to('#terrain', {
      opacity: 0.14,
      ease: 'none',
      scrollTrigger: {
        trigger: '.worlds', start: 'top 85%', end: 'top 30%', scrub: true,
      },
    });
  }

  // pixel-pop reveals for section content
  $$('.rv:not(.hero .rv)').forEach((el) => {
    gsap.fromTo(el,
      { visibility: 'visible', autoAlpha: 0, y: 26 },
      {
        autoAlpha: 1, y: 0, duration: 0.4, ease: 'steps(4)',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      });
  });

  // heading char pops (typed-in feel)
  $$('.px-split').forEach((h) => {
    const chars = h.textContent.split('');
    h.setAttribute('aria-label', h.textContent);
    h.innerHTML = chars.map((c) =>
      `<span aria-hidden="true" style="display:inline-block">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    gsap.from(h.children, {
      autoAlpha: 0, duration: 0.02, stagger: 0.03, ease: 'steps(1)',
      scrollTrigger: { trigger: h, start: 'top 88%' },
    });
  });
} else {
  gsap.set('.rv', { visibility: 'visible', autoAlpha: 1 });
}

/* ---------------- power-up collect ---------------- */
const collected = new Set();
$$('.pu').forEach((pu) => {
  pu.addEventListener('mouseenter', () => {
    sound.blip();
    const plus = $('.plus', pu);
    if (!plus) return;
    gsap.fromTo(plus, { autoAlpha: 1, y: 6 }, {
      autoAlpha: 0, y: -14, duration: 0.7, ease: 'steps(6)',
    });
    if (!collected.has(pu.id)) {
      collected.add(pu.id);
      addBonus(100);
      sound.collect();
    }
  });
});

/* ---------------- hover blips ---------------- */
$$('.cab, .hud a, .hiscore a, .coin-cue').forEach((el) =>
  el.addEventListener('mouseenter', () => sound.blip()));

/* ---------------- screen-wipe page transitions ---------------- */
const wipe = $('#wipe');
$$('a[data-wipe]').forEach((a) => {
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
    e.preventDefault();
    sound.coin();
    if (reduced) { location.href = a.href; return; }
    gsap.timeline()
      .set(wipe, { transformOrigin: 'top' })
      .to(wipe, { scaleY: 1, duration: 0.3, ease: 'steps(6)' })
      .add(() => { location.href = a.href; });
  });
});

/* ---------------- coin cue scrolls you in ---------------- */
$('.coin-cue').addEventListener('click', () => {
  sound.coin();
  $('.pitch').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
});

/* ---------------- footer continue countdown ---------------- */
const countEl = $('#count');
let countTimer = null;
function runCountdown() {
  clearInterval(countTimer);
  let n = 9;
  countEl.textContent = n;
  countEl.classList.remove('blink');
  countTimer = setInterval(() => {
    n -= 1;
    if (n < 0) {
      clearInterval(countTimer);
      countEl.textContent = 'INSERT COIN';
      countEl.classList.add('blink');
      return;
    }
    countEl.textContent = n;
  }, 700);
}
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) runCountdown(); });
  }, { threshold: 0.4 });
  io.observe($('.gameover'));
} else {
  runCountdown();
}

/* ---------------- konami: BULL RUN mode ---------------- */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kPos = 0;
let bullRun = false;
let konamiScored = false;

function confettiBurst() {
  const colors = ['#ffcf3f', '#2bff88', '#3fd9ff'];
  for (let i = 0; i < 70; i++) {
    const d = document.createElement('div');
    d.className = 'confetti';
    d.style.left = `${(i * 137.5) % 100}%`;
    d.style.background = colors[i % 3];
    document.body.appendChild(d);
    gsap.to(d, {
      y: window.innerHeight + 40,
      x: `+=${((i % 7) - 3) * 28}`,
      rotation: ((i % 5) - 2) * 180,
      duration: 1.6 + (i % 10) * 0.12,
      delay: (i % 12) * 0.05,
      ease: 'power1.in',
      onComplete: () => d.remove(),
    });
  }
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  gsap.timeline()
    .to(t, { autoAlpha: 1, y: 0, duration: 0.2, ease: 'steps(3)' })
    .to(t, { autoAlpha: 0, y: -20, duration: 0.3, ease: 'steps(3)' }, '+=2.2');
}

window.addEventListener('keydown', (e) => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  kPos = k === KONAMI[kPos] ? kPos + 1 : (k === KONAMI[0] ? 1 : 0);
  if (kPos !== KONAMI.length) return;
  kPos = 0;
  bullRun = !bullRun;
  if (terrain) terrain.setBullRun(bullRun);
  if (bullRun) {
    if (!konamiScored) { konamiScored = true; addBonus(5000); }
    sound.fanfare();
    if (!reduced) confettiBurst();
    toast('BULL RUN MODE — +5000');
  } else {
    toast('BULL RUN OFF — BACK TO THE BOARD');
  }
});
