#!/usr/bin/env node
/* ============================================================
   白鸽软件库 · 宣传片 氛围音轨合成器
   生成一段舒缓的星空背景音乐（WAV 16bit 立体声）。
   用法: node bgm.js <秒数> <输出.wav>
   风格：低频 pad 长音 + 柔和琶音 + 缓慢音量呼吸 + 淡入淡出
   ============================================================ */
"use strict";

const fs = require("fs");
const DUR = parseFloat(process.argv[2] || "85");
const OUT = process.argv[3] || "bgm.wav";
const SR = 44100;
const N = Math.floor(SR * DUR);
const samples = new Float32Array(N * 2); // 交错立体声

/* 简易随机 */
let _s = 987654321;
function rnd() { _s = (_s * 1664525 + 1013904223) >>> 0; return _s / 4294967296; }

/* 音符频率 */
const A4 = 440;
function note(midi) { return A4 * Math.pow(2, (midi - 69) / 12); }

/* 和弦进行（C - Am - F - G，柔和氛围常用）*/
const CHORDS = [
  { root: 48, third: 52, fifth: 55, seventh: 59, arp: [60, 64, 67, 72] }, // Cmaj7
  { root: 45, third: 48, fifth: 52, seventh: 55, arp: [57, 60, 64, 69] }, // Am7
  { root: 41, third: 45, fifth: 48, seventh: 52, arp: [53, 57, 60, 65] }, // Fmaj7
  { root: 43, third: 47, fifth: 50, seventh: 55, arp: [55, 59, 62, 67] }, // G7
];
const CHORD_SEC = 10.5; // 每和弦约 10.5 秒
const ARP_STEP = 0.42;  // 琶音每步间隔

function addTone(t0, t1, freq, amp, opts) {
  opts = opts || {};
  const a0 = Math.max(0, Math.floor(t0 * SR));
  const a1 = Math.min(N, Math.floor(t1 * SR));
  const attack = opts.attack || 1.2;
  const release = opts.release || 1.5;
  const detune = opts.detune || 0;
  const type = opts.type || 0; // 0=sine 1=triangle
  for (let i = a0; i < a1; i++) {
    const t = i / SR;
    const envIn = Math.min(1, (t - t0) / attack);
    const envOut = Math.min(1, (t1 - t) / release);
    const env = Math.min(envIn, envOut);
    let v;
    if (type === 0) v = Math.sin(2 * Math.PI * freq * t);
    else v = 2 / Math.PI * Math.asin(Math.sin(2 * Math.PI * freq * t)); // 三角波
    v *= 0.6 + 0.4 * v; // 轻微泛音失真
    const L = (i) * 2, R = L + 1;
    samples[L] += v * env * amp;
    samples[R] += v * env * amp * (opts.pan !== undefined ? (1 - opts.pan * 0.4) : 1);
  }
}

function addPad(t0, t1, midi, amp) {
  const f = note(midi);
  addTone(t0, t1, f, amp * 0.9, { type: 0, attack: 3, release: 3 });
  addTone(t0, t1, f * 1.005, amp * 0.5, { type: 0, attack: 3, release: 3, detune: 5 });
  addTone(t0, t1, f * 0.5, amp * 0.6, { type: 0, attack: 4, release: 4 }); // 低八度
}

/* 主循环：pad + 琶音 */
let chordIdx = 0;
for (let t0 = 0; t0 < DUR - 1; t0 += CHORD_SEC) {
  const c = CHORDS[chordIdx % CHORDS.length];
  const t1 = Math.min(DUR, t0 + CHORD_SEC);
  addPad(t0, t1, c.root, 0.16);
  addPad(t0, t1, c.third, 0.13);
  addPad(t0, t1, c.fifth, 0.12);
  addPad(t0, t1, c.seventh, 0.07);

  // 琶音：从和弦音中挑一个上行
  let step = 0;
  for (let at = t0 + 0.3; at < t1 - 0.3 && step < 14; at += ARP_STEP, step++) {
    const nn = c.arp[step % c.arp.length];
    const amp = 0.09 * Math.pow(0.92, step % 4);
    addTone(at, at + 0.7, note(nn), amp, { type: 1, attack: 0.05, release: 0.5, pan: (step % 2) ? 0.6 : -0.6 });
  }
  chordIdx++;
}

/* 整体包络：淡入 4s / 淡出 6s */
const fadeIn = 4, fadeOut = 6;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  let g = 1;
  if (t < fadeIn) g = Math.min(1, t / fadeIn);
  if (t > DUR - fadeOut) g = Math.min(g, Math.max(0, (DUR - t) / fadeOut));
  // 音量呼吸
  const breathe = 0.9 + 0.1 * Math.sin(2 * Math.PI * 0.08 * t);
  samples[i * 2] *= g * breathe;
  samples[i * 2 + 1] *= g * breathe;
}

/* 写 WAV */
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + N * 4, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);   // PCM
header.writeUInt16LE(2, 22);   // 双声道
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(N * 4, 40);

const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  let l = Math.max(-1, Math.min(1, samples[i * 2])) * 32767;
  let r = Math.max(-1, Math.min(1, samples[i * 2 + 1])) * 32767;
  pcm.writeInt16LE(Math.round(l), i * 4);
  pcm.writeInt16LE(Math.round(r), i * 4 + 2);
}
fs.writeFileSync(OUT, Buffer.concat([header, pcm]));
console.log("BGM written:", OUT, (N / SR).toFixed(1) + "s", (header.length + pcm.length / 1048576).toFixed(1) + "MB");
