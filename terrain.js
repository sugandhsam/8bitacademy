/* 8BITTRADING landing — hero set-piece (three.js).
   A monumental coin built from glowing pixel-particles (dot-matrix / LED-wall
   feel, additive on black) that shatters into a candlestick skyline on scroll.
   Rendered at low internal resolution + image-rendering:pixelated. */

import * as THREE from './public/vendor/three.module.min.js';

// Seeded LCG so the shapes are art-directable, not a dice roll per visit.
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ---------- shape builders: arrays of {x,y,z, r,g,b} ---------- */

// "8B" bitmap, 7 rows × 11 cols
const MARK = [
  '.XXX. XXXX.',
  'X...X X...X',
  'X...X X...X',
  '.XXX. XXXX.',
  'X...X X...X',
  'X...X X...X',
  '.XXX. XXXX.',
];

function buildCoin(rnd) {
  const pts = [];
  const R = 19;
  const STEP = 0.8;
  const HALF = 2.2; // half thickness
  const faceDim = [0.72, 0.56, 0.12];   // muted gold face
  const faceLit = [1.0, 0.91, 0.55];    // bright mark
  const rim = [1.0, 0.81, 0.25];        // rim gold

  const markScale = 2.4;
  const mw = MARK[0].length * markScale;
  const mh = MARK.length * markScale;
  const inMark = (x, y) => {
    const cx = Math.floor((x + mw / 2) / markScale);
    const cy = Math.floor((mh / 2 - y) / markScale);
    if (cx < 0 || cy < 0 || cy >= MARK.length || cx >= MARK[0].length) return false;
    return MARK[cy][cx] === 'X';
  };

  for (let x = -R; x <= R; x += STEP) {
    for (let y = -R; y <= R; y += STEP) {
      const d = Math.hypot(x, y);
      if (d > R) continue;
      const jx = x + (rnd() - 0.5) * 0.3;
      const jy = y + (rnd() - 0.5) * 0.3;
      const mark = inMark(x, y);
      const ring = d > R - 1.6;
      // front + back faces
      for (const side of [1, -1]) {
        const c = mark ? faceLit : (ring ? rim : faceDim);
        // sparse interior so the mark + rim dominate; denser on front
        const keep = mark ? 1 : ring ? 0.9 : (side === 1 ? 0.34 : 0.16);
        if (rnd() < keep) pts.push({ x: jx, y: jy, z: side * HALF, r: c[0], g: c[1], b: c[2] });
      }
      // rim shell
      if (ring && rnd() < 0.7) {
        const zz = (rnd() * 2 - 1) * HALF;
        pts.push({ x: jx, y: jy, z: zz, r: rim[0], g: rim[1], b: rim[2] });
      }
    }
  }
  return pts;
}

function buildSkyline(rnd) {
  const pts = [];
  const N = 84;
  const SPACING = 1.35;
  const H = 0.5;
  const up = [0.17, 1.0, 0.53];
  const dn = [1.0, 0.23, 0.36];
  const wick = [0.42, 0.47, 0.62];

  let price = 46;
  let drift = 0;
  for (let i = 0; i < N; i++) {
    if (rnd() < 0.09) drift = (rnd() - 0.45) * 2.6;
    const open = price;
    const close = Math.max(8, open + drift + (rnd() - 0.5) * 4.4);
    const hi = Math.max(open, close) + rnd() * 2.4;
    const lo = Math.max(3, Math.min(open, close) - rnd() * 2.4);
    price = close;

    const x = (i - N / 2) * SPACING;
    const isUp = close >= open;
    const c = isUp ? up : dn;
    const bLo = Math.min(open, close) * H;
    const bHi = Math.max(open, close) * H;
    const step = 0.62;
    for (let y = bLo; y <= bHi; y += step) {
      for (let dx = -0.45; dx <= 0.45; dx += 0.45) {
        if (rnd() < 0.85) {
          pts.push({
            x: x + dx, y: y - 14, z: (rnd() - 0.5) * 1.2,
            r: c[0], g: c[1], b: c[2],
          });
        }
      }
    }
    for (let y = lo * H; y <= hi * H; y += step) {
      if (rnd() < 0.5) pts.push({ x, y: y - 14, z: 0, r: wick[0], g: wick[1], b: wick[2] });
    }
  }
  return pts;
}

function buildDust(rnd, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = 26 + rnd() * 46;
    pts.push({
      x: Math.cos(a) * rr,
      y: (rnd() * 2 - 1) * 34,
      z: -6 - rnd() * 30,
      r: 0.35 + rnd() * 0.2, g: 0.5 + rnd() * 0.25, b: 0.62 + rnd() * 0.3,
    });
  }
  return pts;
}

/* ---------- glow halo texture (canvas radial gradient) ---------- */
function glowTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 207, 63, 0.55)');
  g.addColorStop(0.4, 'rgba(255, 160, 40, 0.16)');
  g.addColorStop(1, 'rgba(255, 140, 30, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

const VERT = /* glsl */`
  attribute vec3 aPosB;
  attribute vec3 aColA;
  attribute vec3 aColB;
  attribute vec3 aDir;
  attribute vec3 aRnd;   // phase, scatterAmp, sizeVar
  uniform float uMix;
  uniform float uSpin;
  uniform float uSize;
  varying vec3 vColA;
  varying vec3 vColB;
  varying float vPhase;
  void main() {
    float c = cos(uSpin), s = sin(uSpin);
    vec3 pa = vec3(c * position.x + s * position.z, position.y, -s * position.x + c * position.z);
    vec3 p = mix(pa, aPosB, uMix) + aDir * (sin(3.14159 * uMix) * aRnd.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * aRnd.z * (120.0 / -mv.z);
    vColA = aColA;
    vColB = aColB;
    vPhase = aRnd.x;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */`
  uniform float uTime;
  uniform float uMix;
  uniform float uBull;
  varying vec3 vColA;
  varying vec3 vColB;
  varying float vPhase;
  void main() {
    vec3 col = mix(vColA, vColB, uMix);
    col = mix(col, vec3(0.17, 1.0, 0.53), uBull * 0.65);
    float tw = 0.55 + 0.45 * sin(uTime * (1.2 + vPhase * 2.4) + vPhase * 43.0);
    tw = pow(tw, 2.6) * (1.0 + uBull * 0.7);
    gl_FragColor = vec4(col * (0.2 + 1.05 * tw), 1.0);
  }
`;

export function createTerrain(canvas, { animate = true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    return null; // no WebGL — caller falls back to plain background
  }

  const PIXEL_SCALE = 0.3; // internal res vs CSS size → LED-matrix chunk
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050a);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 220);
  camera.position.set(0, 1.5, 62);
  camera.lookAt(0, 0, 0);

  const rnd = lcg(0x8b17);
  const coin = buildCoin(rnd);
  const sky = buildSkyline(rnd);
  const dust = buildDust(rnd, 520);

  // pad the smaller shape so every particle has a home in both forms
  const nMain = Math.max(coin.length, sky.length);
  while (coin.length < nMain) coin.push(coin[(rnd() * coin.length) | 0]);
  while (sky.length < nMain) sky.push(sky[(rnd() * sky.length) | 0]);

  const N = nMain + dust.length;
  const posA = new Float32Array(N * 3);
  const posB = new Float32Array(N * 3);
  const colA = new Float32Array(N * 3);
  const colB = new Float32Array(N * 3);
  const dir = new Float32Array(N * 3);
  const rndAttr = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const main = i < nMain;
    const a = main ? coin[i] : dust[i - nMain];
    const b = main ? sky[i] : dust[i - nMain];
    posA.set([a.x, a.y, a.z], i * 3);
    posB.set([b.x, b.y, b.z], i * 3);
    colA.set([a.r, a.g, a.b], i * 3);
    colB.set([b.r, b.g, b.b], i * 3);
    // scatter direction: random sphere, dust barely moves
    const th = rnd() * Math.PI * 2;
    const ph = Math.acos(rnd() * 2 - 1);
    const amp = main ? 6 + rnd() * 22 : rnd() * 2;
    dir.set([
      Math.sin(ph) * Math.cos(th),
      Math.sin(ph) * Math.sin(th),
      Math.cos(ph) * 0.6,
    ], i * 3);
    rndAttr.set([rnd(), amp, main ? 0.75 + rnd() * 0.55 : 0.3 + rnd() * 0.25], i * 3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posA, 3));
  geo.setAttribute('aPosB', new THREE.BufferAttribute(posB, 3));
  geo.setAttribute('aColA', new THREE.BufferAttribute(colA, 3));
  geo.setAttribute('aColB', new THREE.BufferAttribute(colB, 3));
  geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rndAttr, 3));
  geo.computeBoundingSphere();

  const uniforms = {
    uTime: { value: 0 },
    uMix: { value: 0 },
    uSpin: { value: 0 },
    uBull: { value: 0 },
    uSize: { value: 1.15 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });

  const group = new THREE.Group();
  const points = new THREE.Points(geo, mat);
  group.add(points);

  // warm halo behind the coin
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.55,
  }));
  halo.scale.set(95, 95, 1);
  halo.position.set(0, 0, -8);
  group.add(halo);
  scene.add(group);

  let progress = 0;
  let baseZ = 62;
  let bullTarget = 0;
  let t = 0;
  const pointer = { x: 0, y: 0 };
  const ease = (p) => p * p * (3 - 2 * p); // smoothstep

  function apply() {
    const m = ease(Math.min(1, Math.max(0, progress)));
    uniforms.uMix.value = m;
    uniforms.uSpin.value = t * 0.45;
    uniforms.uTime.value = t;
    uniforms.uBull.value += (bullTarget - uniforms.uBull.value) * 0.08;
    halo.material.opacity = (1 - m) * 0.5 + uniforms.uBull.value * 0.25;
    halo.scale.setScalar(95 + Math.sin(t * 0.9) * 6 + m * 40);
    group.position.y = Math.sin(t * 0.7) * 0.9 - m * 7;
    // pointer parallax
    group.rotation.y += ((pointer.x * 0.14) - group.rotation.y) * 0.05;
    group.rotation.x += ((-pointer.y * 0.09) - group.rotation.x) * 0.05;
    camera.position.z = baseZ - m * 8;
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    baseZ = camera.aspect < 1 ? 62 + (1 - camera.aspect) * 46 : 62;
    camera.updateProjectionMatrix();
    renderer.setSize(Math.max(2, w * PIXEL_SCALE) | 0, Math.max(2, h * PIXEL_SCALE) | 0, false);
  }

  let raf = 0;
  let running = false;
  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);
    t += clock.getDelta() * (uniforms.uBull.value > 0.5 ? 1.9 : 1);
    apply();
    renderer.render(scene, camera);
  }

  function start() {
    if (running || !animate) return;
    running = true;
    clock.start();
    frame();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function renderStill() {
    t = 2.4; // a flattering fixed twinkle phase
    apply();
    renderer.render(scene, camera);
  }

  resize();
  renderStill();
  if (animate) start();
  else requestAnimationFrame(() => { resize(); renderStill(); });

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  return {
    setProgress(p) {
      progress = Math.min(1, Math.max(0, p));
      if (!running) renderStill();
    },
    setBullRun(on) {
      bullTarget = on ? 1 : 0;
      if (!running) renderStill();
    },
    stop,
    start,
  };
}
