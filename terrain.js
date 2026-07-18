/* 8BITTRADING landing — voxel candlestick terrain (three.js set-piece).
   Rendered at low internal resolution + CSS image-rendering:pixelated
   for the chunky 8-bit look (and cheap frames). */

import * as THREE from './public/vendor/three.module.min.js';

const BG = 0x06070d;
const GREEN = 0x2bff88;
const RED = 0xff3b5c;
const WICK = 0x2a2f45;

// Seeded LCG so the skyline is art-directable, not a dice roll per visit.
function lcg(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function makeSeries(rnd, n) {
  const candles = [];
  let price = 50;
  let drift = 0;
  for (let i = 0; i < n; i++) {
    if (rnd() < 0.08) drift = (rnd() - 0.45) * 2.4; // regime shifts
    const open = price;
    const move = drift + (rnd() - 0.5) * 4.2;
    const close = Math.max(6, open + move);
    const hi = Math.max(open, close) + rnd() * 2.2;
    const lo = Math.max(2, Math.min(open, close) - rnd() * 2.2);
    candles.push({ open, close, hi, lo });
    price = close;
  }
  return candles;
}

export function createTerrain(canvas, { animate = true } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  } catch (e) {
    return null; // no WebGL — caller falls back to plain background
  }

  const PIXEL_SCALE = 0.28; // internal res vs CSS size → voxel chunk
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 26, 92);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sun = new THREE.DirectionalLight(0xfff2cc, 1.15);
  sun.position.set(-14, 30, 18);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x3fd9ff, 0.35);
  rim.position.set(20, 8, -24);
  scene.add(rim);

  const rnd = lcg(0x8b17);
  const N = 150;
  const ROWS = [
    { z: 0, scale: 1, dimmed: 1 },      // front ridge
    { z: -14, scale: 0.8, dimmed: 0.55 }, // mid ridge
    { z: -30, scale: 0.62, dimmed: 0.3 }, // far skyline
  ];
  const SPACING = 1.9;

  const bodyGeo = new THREE.BoxGeometry(1.35, 1, 1.35);
  const wickGeo = new THREE.BoxGeometry(0.42, 1, 0.42);
  const mat = new THREE.MeshLambertMaterial();
  const wickMat = new THREE.MeshLambertMaterial({ color: WICK });

  const total = N * ROWS.length;
  const bodies = new THREE.InstancedMesh(bodyGeo, mat, total);
  const wicks = new THREE.InstancedMesh(wickGeo, wickMat, total);
  const baseColors = new Float32Array(total * 3); // remembered for konami restore
  const green = new THREE.Color(GREEN);
  const red = new THREE.Color(RED);
  const tmpC = new THREE.Color();
  const m = new THREE.Matrix4();

  let idx = 0;
  const H = 0.42; // world units per price unit
  for (const row of ROWS) {
    const series = makeSeries(rnd, N);
    for (let i = 0; i < N; i++) {
      const c = series[i];
      const x = (i - N / 2) * SPACING;
      const up = c.close >= c.open;
      const bodyLo = Math.min(c.open, c.close) * H * row.scale;
      const bodyHi = Math.max(c.open, c.close) * H * row.scale;
      const bodyH = Math.max(0.6, bodyHi - bodyLo);

      // voxel-snap heights to the grid so rows read as stacked blocks
      const snap = (v) => Math.round(v / 0.6) * 0.6;

      m.makeScale(row.scale, snap(bodyH), row.scale);
      m.setPosition(x, snap(bodyLo) + snap(bodyH) / 2, row.z);
      bodies.setMatrixAt(idx, m);

      tmpC.copy(up ? green : red).multiplyScalar(row.dimmed);
      bodies.setColorAt(idx, tmpC);
      baseColors[idx * 3] = tmpC.r;
      baseColors[idx * 3 + 1] = tmpC.g;
      baseColors[idx * 3 + 2] = tmpC.b;

      const wickLo = c.lo * H * row.scale;
      const wickH = Math.max(0.5, (c.hi - c.lo) * H * row.scale);
      m.makeScale(row.scale, snap(wickH), row.scale);
      m.setPosition(x, snap(wickLo) + snap(wickH) / 2, row.z);
      wicks.setMatrixAt(idx, m);
      idx++;
    }
  }
  bodies.instanceMatrix.needsUpdate = true;
  bodies.instanceColor.needsUpdate = true;
  wicks.instanceMatrix.needsUpdate = true;
  scene.add(bodies, wicks);

  // ground grid — faint cyan wireframe floor
  const grid = new THREE.GridHelper(320, 80, 0x1c2032, 0x141726);
  grid.position.y = 0.6;
  scene.add(grid);

  // camera path: low drift along the ridge, driven by scroll progress
  let progress = 0; // 0 hero → 1 end of pitch
  let bullRun = false;
  let t = 0;
  const CAM_X_START = -78;
  const CAM_X_END = 66;

  function placeCamera() {
    const x = CAM_X_START + (CAM_X_END - CAM_X_START) * progress;
    const bob = Math.sin(t * 0.6) * 0.5;
    camera.position.set(x, 11.5 + Math.sin(progress * Math.PI) * 5 + bob, 26 - progress * 7);
    camera.lookAt(x + 24, 10, -6);
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(Math.max(2, w * PIXEL_SCALE) | 0, Math.max(2, h * PIXEL_SCALE) | 0, false);
  }

  let raf = 0;
  let running = false;
  const clock = new THREE.Clock();

  function frame() {
    raf = requestAnimationFrame(frame);
    t += clock.getDelta() * (bullRun ? 2.2 : 1);
    placeCamera();
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

  resize();
  placeCamera();
  renderer.render(scene, camera); // always at least one frame (reduced-motion path)
  if (animate) start();
  else requestAnimationFrame(() => { resize(); placeCamera(); renderer.render(scene, camera); });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });

  return {
    setProgress(p) {
      progress = Math.min(1, Math.max(0, p));
      if (!running) { placeCamera(); renderer.render(scene, camera); }
    },
    setBullRun(on) {
      bullRun = on;
      for (let i = 0; i < total; i++) {
        if (on) {
          tmpC.setRGB(baseColors[i * 3], baseColors[i * 3 + 1], baseColors[i * 3 + 2]);
          const lum = (tmpC.r + tmpC.g + tmpC.b) / 3;
          tmpC.copy(green).multiplyScalar(Math.max(0.3, lum * 2.2));
        } else {
          tmpC.setRGB(baseColors[i * 3], baseColors[i * 3 + 1], baseColors[i * 3 + 2]);
        }
        bodies.setColorAt(i, tmpC);
      }
      bodies.instanceColor.needsUpdate = true;
      if (!running) renderer.render(scene, camera);
    },
    stop,
    start,
  };
}
