/* 8bitTrading landing — dot-matrix candle tape hero + quiet scroll motion */
import * as THREE from 'three';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PARAMS = new URLSearchParams(location.search);
const STILL = PARAMS.has('still'); // test hook: skip intro
// test hook: cap hero height so a tall headless window captures the full page
if (PARAMS.has('flat')) document.getElementById('hero').style.height = '640px';

gsap.registerPlugin(ScrollTrigger);

/* ============================================================
   HERO — dot-matrix candlestick tape (locked prototype B)
   ============================================================ */
const ACCENT = new THREE.Color('#3dd68c');
const GREY   = new THREE.Color('#4a4a52');
const DOWN   = new THREE.Color('#787882');

const canvas = document.getElementById('tape');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 0.4, 14);

function sizeToHero() {
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
sizeToHero();

function makeSoftSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function makeHardSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.72, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const softSprite = makeSoftSprite();
const hardSprite = makeHardSprite();

const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

const group = new THREE.Group();
scene.add(group);

const COLS = 190, ROWS = 56, SPACING = 0.095;
const N = COLS * ROWS;

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));

const pts = new THREE.Points(geo, new THREE.PointsMaterial({
  size: 0.07,
  map: hardSprite,
  vertexColors: true,
  transparent: true,
  depthWrite: false,
}));
group.add(pts);

// halo shares positions but has its own colors → selective neon glow
const haloGeo = new THREE.BufferGeometry();
haloGeo.setAttribute('position', geo.attributes.position);
haloGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));

const halo = new THREE.Points(haloGeo, new THREE.PointsMaterial({
  size: 0.3,
  map: softSprite,
  vertexColors: true,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
}));
group.add(halo);

// mean-reverting random-walk OHLC series in 0..1, looped
const CANDLES = 240;
const CANDLE_W = 6; // 4 body columns + 2 gap
const TOTAL = CANDLES * CANDLE_W;
const MIN_BODY = 1.5 / (ROWS - 1);
const series = [];
let price = 0.5;
for (let i = 0; i < CANDLES; i++) {
  const o = price;
  let cl = o + (0.5 - o) * 0.06 + (Math.random() - 0.5) * 0.3;
  cl = Math.min(0.95, Math.max(0.05, cl));
  const hi = Math.min(0.99, Math.max(o, cl) + Math.random() * 0.09);
  const lo = Math.max(0.01, Math.min(o, cl) - Math.random() * 0.09);
  const up = cl >= o;
  const glow = up ? (Math.random() < 0.45 ? 0.7 + Math.random() * 0.5 : 0.15)
                  : (Math.random() < 0.12 ? 0.45 : 0.05);
  series.push({ o, c: cl, h: hi, l: lo, up, glow });
  price = cl;
}

group.position.set(0, -1.7, 0);
const tmp = new THREE.Color();
const tmp2 = new THREE.Color();

function update(t) {
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  const halfW = halfH * camera.aspect;
  const mx = mouse.sx * halfW;
  const my = camera.position.y + mouse.sy * halfH - group.position.y;

  const offset = t * 2.4; // tape streams right → left

  const pAttr = geo.attributes.position;
  const cAttr = geo.attributes.color;
  const hAttr = haloGeo.attributes.color;

  for (let r = 0; r < ROWS; r++) {
    const y = (r - ROWS / 2) * SPACING;
    const pr = r / (ROWS - 1);
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const x = (c - COLS / 2) * SPACING;

      const gc = Math.floor(((c + offset) % TOTAL + TOTAL) % TOTAL);
      const s = series[Math.floor(gc / CANDLE_W)];
      const pos = gc % CANDLE_W;

      let lum = 0.14; // faint background matrix dot
      if (pos < 4) {
        let bLo = Math.min(s.o, s.c), bHi = Math.max(s.o, s.c);
        if (bHi - bLo < MIN_BODY) { const m = (bLo + bHi) / 2; bLo = m - MIN_BODY / 2; bHi = m + MIN_BODY / 2; }
        if (pr >= bLo && pr <= bHi) lum = 1;
        else if ((pos === 1 || pos === 2) && pr >= s.l && pr <= s.h) lum = 0.5;
      }

      const dx = x - mx, dy = y - my;
      const boost = Math.exp(-(dx * dx + dy * dy) / 1.1);
      pAttr.setXYZ(i, x, y, 0.9 * boost);

      const fade = 0.1 + 0.9 * Math.pow(c / (COLS - 1), 1.6);
      const isCandle = lum > 0.14;
      tmp.copy(isCandle ? (s.up ? ACCENT : DOWN) : GREY)
         .multiplyScalar((lum + 0.6 * boost * lum + 0.08 * boost) * fade);
      cAttr.setXYZ(i, tmp.r, tmp.g, tmp.b);

      const glowLum = lum >= 1 ? s.glow : (isCandle ? 0.15 * s.glow : 0);
      tmp2.copy(s.up ? ACCENT : DOWN)
          .multiplyScalar(glowLum * (1 + 0.9 * boost) * fade);
      hAttr.setXYZ(i, tmp2.r, tmp2.g, tmp2.b);
    }
  }
  pAttr.needsUpdate = true;
  cAttr.needsUpdate = true;
  hAttr.needsUpdate = true;

  group.rotation.y = mouse.sx * 0.05;
  group.rotation.x = -mouse.sy * 0.03;
}

// render only while the hero is on screen
let heroVisible = true;
const clock = new THREE.Clock();
function frame() {
  if (heroVisible) {
    mouse.sx += (mouse.x - mouse.sx) * 0.045;
    mouse.sy += (mouse.y - mouse.sy) * 0.045;
    update(clock.getElapsedTime());
    renderer.render(scene, camera);
  }
  if (!REDUCED) requestAnimationFrame(frame);
}
frame();
if (REDUCED) { update(0.001); renderer.render(scene, camera); }

new IntersectionObserver((entries) => {
  heroVisible = entries[0].isIntersecting;
}).observe(document.getElementById('hero'));

window.addEventListener('resize', sizeToHero);

/* ============================================================
   MOTION — intro + scroll reveals
   ============================================================ */
if (REDUCED || STILL) {
  gsap.set('#tape', { opacity: 1 });
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
} else {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('nav', { opacity: 0, y: -12, duration: 0.9 }, 0.15)
    .from('.kicker', { opacity: 0, y: 14, duration: 0.8 }, 0.35)
    .from('h1 .line > span', { yPercent: 110, duration: 1.0, stagger: 0.09 }, 0.45)
    .from('.sub', { opacity: 0, y: 16, duration: 0.9 }, 0.85)
    .from('.cta-row', { opacity: 0, y: 16, duration: 0.9 }, 1.0)
    .to('#tape', { opacity: 1, duration: 1.8, ease: 'power2.inOut' }, 0.6)
    .from('.status-line, .scroll-cue', { opacity: 0, duration: 1.0 }, 1.4);

  // feature sections: reveal children with a small stagger as they enter
  document.querySelectorAll('.reveal').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      once: true,
      onEnter: () => el.classList.add('in'),
    });
  });

  // stagger the small tiles inside each visual as it reveals
  document.querySelectorAll('.feature-visual').forEach((vis) => {
    const items = vis.querySelectorAll('.module, .ind-tile, .chat-row, .pb-step');
    if (!items.length) return;
    gsap.from(items, {
      opacity: 0,
      y: 14,
      duration: 0.7,
      stagger: 0.07,
      ease: 'power3.out',
      scrollTrigger: { trigger: vis, start: 'top 80%', once: true },
    });
  });
}

// nav backdrop after leaving the hero
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });
