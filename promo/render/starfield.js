#!/usr/bin/env node
/* ============================================================
   白鸽软件库 · 宣传片 星空帧渲染器
   逐帧生成 raw RGB24 像素流，通过 stdout 管道给 ffmpeg 编码。
   用法: node starfield.js <W> <H> <FPS> <DUR> [SEED]
   场景光晕配色随时间线性切换，营造叙事感。
   ============================================================ */
"use strict";

const W = parseInt(process.argv[2] || "1920", 10);
const H = parseInt(process.argv[3] || "1080", 10);
const FPS = parseInt(process.argv[4] || "30", 10);
const DUR = parseFloat(process.argv[5] || "85");
const SEED = parseInt(process.argv[6] || "20260901", 10);

// 简单可复现随机
let _seed = SEED >>> 0;
function rnd() {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 4294967296;
}

const FRAMES = Math.round(FPS * DUR);
const N = W * H * 3;
const frame = new Uint8Array(N);

/* ---------- 场景时间轴（按 DUR 比例均匀分布 + 首尾黑场） ---------- */
const TOTAL = DUR;
const HEAD = DUR * 0.04;      // 开头黑场渐亮
const TAIL = DUR * 0.05;      // 结尾渐暗
const SCENES = [
  { name: "logo",     hue: 215, glow: 0.55 },   // 蓝
  { name: "hero",     hue: 200, glow: 0.65 },   // 天青
  { name: "features", hue: 255, glow: 0.6  },   // 蓝紫
  { name: "products", hue: 190, glow: 0.6  },   // 青
  { name: "about",    hue: 240, glow: 0.6  },   // 紫
  { name: "cta",      hue: 210, glow: 0.7  },   // 亮蓝
];
const N_SCENE = SCENES.length;
const SEG = (TOTAL - HEAD - TAIL) / N_SCENE;

function sceneAt(t) {
  // 返回插值后的 {hue, glow}
  const tt = Math.max(0, Math.min(TOTAL, t));
  const raw = (tt - HEAD) / SEG;
  const idx = Math.max(0, Math.min(N_SCENE - 1, Math.floor(raw)));
  const next = Math.min(N_SCENE - 1, idx + 1);
  const f = Math.max(0, Math.min(1, raw - idx));
  const a = SCENES[idx], b = SCENES[next];
  let dh = b.hue - a.hue;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return { hue: a.hue + dh * f, glow: a.glow + (b.glow - a.glow) * f };
}

/* ---------- 深空背景（预渲染，垂直渐变 + 银河星带） ---------- */
const bg = new Uint8Array(N);
(function buildBg() {
  for (let y = 0; y < H; y++) {
    const fy = y / H;
    // 顶部深蓝 -> 中部藏青 -> 底部近黑
    let r, g, b;
    if (fy < 0.55) {
      const t = fy / 0.55;
      r = Math.round(8 + 10 * t);
      g = Math.round(12 + 16 * t);
      b = Math.round(28 + 26 * t);
    } else {
      const t = (fy - 0.55) / 0.45;
      r = Math.round(18 - 14 * t);
      g = Math.round(28 - 22 * t);
      b = Math.round(54 - 44 * t);
    }
    // 银河斜带：一条横贯的微亮带
    const band = Math.exp(-Math.pow((fy - 0.38) / 0.16, 2)) * 9;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      bg[i] = Math.min(255, r + band);
      bg[i + 1] = Math.min(255, g + band);
      bg[i + 2] = Math.min(255, b + band);
    }
  }
  // 银河带上的小亮点
  for (let i = 0; i < W * 0.06; i++) {
    const x = rnd() * W;
    const y = H * (0.3 + rnd() * 0.2);
    const rr = 0.6 + rnd() * 1.0;
    const br = 120 + rnd() * 120;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const px = Math.round(x + dx), py = Math.round(y + dy);
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const i = (py * W + px) * 3;
      const a = (dx === 0 && dy === 0) ? 1 : 0.5;
      bg[i] = Math.min(255, bg[i] + br * a);
      bg[i + 1] = Math.min(255, bg[i + 1] + br * a);
      bg[i + 2] = Math.min(255, bg[i + 2] + br * a);
    }
  }
})();

/* ---------- 星星 ---------- */
const STAR_COUNT = Math.round((W * H) / 6200); // 1080p ~336 颗
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: rnd() * W,
    y: rnd() * H,
    r: 0.4 + rnd() * 1.3,
    base: 0.25 + rnd() * 0.75,
    sp: 0.4 + rnd() * 2.2,        // 闪烁速度
    ph: rnd() * Math.PI * 2,      // 相位
    hue: rnd() < 0.85 ? 215 : 185,
    drift: rnd() * 0.00006 + 0.00002, // 缓慢漂移
  });
}

/* ---------- 大光晕（2 个，缓慢漂移） ---------- */
const glowBlobs = [
  { x: 0.28, y: 0.3, r: 0.34, driftX: 0.004, driftY: 0.002, amp: 0.10 },
  { x: 0.72, y: 0.62, r: 0.4, driftX: -0.003, driftY: 0.003, amp: 0.08 },
];

/* ---------- 流星 ---------- */
const meteors = [];
let nextMeteor = 1.5 + rnd() * 3;

function drawCircle(cx, cy, rad, r, g, b, alpha) {
  const r2 = rad * rad;
  const x0 = Math.max(0, Math.floor(cx - rad)), x1 = Math.min(W - 1, Math.ceil(cx + rad));
  const y0 = Math.max(0, Math.floor(cy - rad)), y1 = Math.min(H - 1, Math.ceil(cy + rad));
  for (let y = y0; y <= y1; y++) {
    const dy = y - cy;
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const i = (y * W + x) * 3;
      const a = alpha * (1 - Math.sqrt(d2) / rad);
      frame[i] = Math.min(255, frame[i] + r * a);
      frame[i + 1] = Math.min(255, frame[i + 1] + g * a);
      frame[i + 2] = Math.min(255, frame[i + 2] + b * a);
    }
  }
}

/* ---------- 场景主光晕衰减表（预计算一次，避免每帧重复开方） ---------- */
const GLOW_STEP = 2;
const glowCols = Math.ceil(W / GLOW_STEP);
const glowRows = Math.ceil(H / GLOW_STEP);
const glowFalloff = new Float32Array(glowCols * glowRows);
(function buildGlow() {
  const gx = W * 0.5, gy = H * 0.46, gr = Math.max(W, H) * 0.55;
  for (let ry = 0; ry < glowRows; ry++) {
    const y = ry * GLOW_STEP;
    const dy = y - gy;
    for (let rx = 0; rx < glowCols; rx++) {
      const x = rx * GLOW_STEP;
      const dx = x - gx;
      const d = Math.sqrt(dx * dx + dy * dy) / gr;
      if (d >= 1) { glowFalloff[ry * glowCols + rx] = 0; continue; }
      const q = 1 - d;
      glowFalloff[ry * glowCols + rx] = q * q;
    }
  }
})();

function hsvToRgb255(h, s, v) {
  const c = v * s * (1 - Math.abs(((h / 60) % 2) - 1));
  let rr, gg, bb;
  if (h < 60) { rr = v; gg = c; bb = 0; }
  else if (h < 120) { rr = c; gg = v; bb = 0; }
  else if (h < 180) { rr = 0; gg = v; bb = c; }
  else if (h < 240) { rr = 0; gg = c; bb = v; }
  else if (h < 300) { rr = c; gg = 0; bb = v; }
  else { rr = v; gg = 0; bb = c; }
  return [rr * 255, gg * 255, bb * 255];
}

/* ---------- 逐帧渲染 ---------- */
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const sc = sceneAt(t);

  // 1. 背景
  frame.set(bg);

  // 2. 场景主光晕（用预计算衰减表 + 当前场景色调）
  const glowFade = 0.16 + sc.glow * 0.10;
  const hsv = hsvToRgb255(sc.hue, 0.55, 1.0);
  const cr = hsv[0] * glowFade, cg = hsv[1] * glowFade, cb = hsv[2] * glowFade;
  for (let ry = 0; ry < glowRows; ry++) {
    const y = ry * GLOW_STEP;
    const rowOff = y * W;
    const base = ry * glowCols;
    for (let rx = 0; rx < glowCols; rx++) {
      const a = glowFalloff[base + rx];
      if (a <= 0.002) continue;
      const i = (rowOff + rx * GLOW_STEP) * 3;
      frame[i] = Math.min(255, frame[i] + cr * a);
      frame[i + 1] = Math.min(255, frame[i + 1] + cg * a);
      frame[i + 2] = Math.min(255, frame[i + 2] + cb * a);
    }
  }

  // 3. 大光晕
  for (const b of glowBlobs) {
    const bx = (b.x + Math.sin(t * b.driftX) * 0.02) * W;
    const by = (b.y + Math.sin(t * b.driftY) * 0.02) * H;
    const br = b.r * Math.max(W, H);
    drawCircle(bx, by, br, 90, 140, 255, b.amp);
  }

  // 4. 流星
  if (t > nextMeteor) {
    meteors.push({
      x: rnd() * W * 0.9,
      y: rnd() * H * 0.3,
      vx: 6 + rnd() * 6,
      vy: 3.5 + rnd() * 4,
      life: 0.8 + rnd() * 0.5,
    });
    nextMeteor = t + 2.5 + rnd() * 3.5;
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.x += m.vx; m.y += m.vy; m.life -= 0.03;
    if (m.life <= 0 || m.x > W + 40 || m.y > H + 40) { meteors.splice(i, 1); continue; }
    const seg = 18;
    for (let k = 0; k < seg; k++) {
      const tt = k / seg;
      const px = m.x - m.vx * tt * 3, py = m.y - m.vy * tt * 3;
      const a = (1 - tt) * m.life;
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const i3 = (Math.round(py) * W + Math.round(px)) * 3;
      frame[i3] = Math.min(255, frame[i3] + 255 * a);
      frame[i3 + 1] = Math.min(255, frame[i3 + 1] + 250 * a);
      frame[i3 + 2] = Math.min(255, frame[i3 + 2] + 240 * a);
    }
  }

  // 5. 星星
  for (const s of stars) {
    s.x += s.drift * (s.x - W / 2) * 0 + (s.drift * 30);
    if (s.x > W + 3) s.x = -3; if (s.x < -3) s.x = W + 3;
    const tw = 0.72 + 0.28 * Math.sin(t * s.sp + s.ph);
    const a = s.base * tw;
    drawCircle(s.x, s.y, s.r, 230, 235, 255, a * 0.9);
  }

  // 6. 整体明暗（首尾黑场）
  const fadeIn = Math.min(1, t / (HEAD + 0.001));
  const fadeOut = Math.max(0, Math.min(1, (TOTAL - t) / (TAIL + 0.001)));
  const globalA = fadeIn * fadeOut;
  for (let i = 0; i < N; i += 3) {
    frame[i] = Math.round(frame[i] * globalA);
    frame[i + 1] = Math.round(frame[i + 1] * globalA);
    frame[i + 2] = Math.round(frame[i + 2] * globalA);
  }

  // 输出本帧
  process.stdout.write(frame);
}
