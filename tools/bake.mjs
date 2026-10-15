#!/usr/bin/env node
// 브라우저 없이 스프라이트 시트 PNG 와 매니페스트를 굽는다 (의존성 없음, 자체 래스터라이저).
//
//   node tools/bake.mjs <variant> [--phase loop|enter|exit|all] [--frame 48] [--fps 30]
//                       [--color #d97757] [--bg none|#1f1e1d] [--out dist] [--contact]
//
// variant 자리에 all 을 주면 라이브러리 변형 전부를, 쉼표로 이으면(ring,snake) 그것들만 굽는다.
// --contact 를 주면 프레임을 가로 20개씩 늘어놓은 확인용 이미지(…contact.png)도 만든다.

import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { list, get, sample } from '../src/dots.js';
import { variants } from '../src/variants/index.js';
import '../src/variants/archive/index.js';   // 보관한 변형도 이름으로는 구울 수 있게 (all 에는 안 들어감)

// ---- 인자 ------------------------------------------------------------------
const args = process.argv.slice(2);
const opt = { phase: 'all', frame: 48, fps: 30, color: '#d97757', bg: 'none', out: 'dist', contact: false };
let target = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--contact') opt.contact = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
  else target = a;
}
if (!target) {
  console.error('사용법: node tools/bake.mjs <variant[,variant…]|all> [--phase loop|enter|exit|all] [--frame 48] [--fps 30] [--color #d97757] [--bg none|#rrggbb] [--out dist] [--contact]');
  console.error('변형:', list().map((v) => v.id).join(', '));
  process.exit(1);
}
opt.frame = Number(opt.frame);
opt.fps = Number(opt.fps);

// ---- 색 --------------------------------------------------------------------
function hex(c) {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) throw new Error(`색은 #rrggbb 형식이어야 합니다: ${c}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const COLOR = hex(opt.color);
const BG = opt.bg === 'none' ? null : hex(opt.bg);

// ---- 래스터라이저 (RGBA, 알파 합성, 4x4 수퍼샘플) -------------------------------
class Raster {
  constructor(w, h) { this.w = w; this.h = h; this.data = new Uint8ClampedArray(w * h * 4); if (BG) this.fill(BG); }
  fill([r, g, b]) { for (let i = 0; i < this.data.length; i += 4) { this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = 255; } }
  blend(x, y, [r, g, b], a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    const da = this.data[i + 3] / 255;
    const oa = a + da * (1 - a);
    if (oa <= 0) return;
    this.data[i] = (r * a + this.data[i] * da * (1 - a)) / oa;
    this.data[i + 1] = (g * a + this.data[i + 1] * da * (1 - a)) / oa;
    this.data[i + 2] = (b * a + this.data[i + 2] * da * (1 - a)) / oa;
    this.data[i + 3] = oa * 255;
  }
  /** coverage(px, py) → 0..1 을 주는 함수로 영역을 칠한다 */
  paint(x0, y0, x1, y1, color, alpha, coverage) {
    const S = 4, inv = 1 / (S * S);
    for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(this.h - 1, Math.ceil(y1)); y++) {
      for (let x = Math.max(0, Math.floor(x0)); x <= Math.min(this.w - 1, Math.ceil(x1)); x++) {
        let c = 0;
        for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) c += coverage(x + (sx + 0.5) / S, y + (sy + 0.5) / S);
        if (c > 0) this.blend(x, y, color, alpha * c * inv);
      }
    }
  }
  circle(cx, cy, r, color, alpha = 1) {
    this.paint(cx - r - 1, cy - r - 1, cx + r + 1, cy + r + 1, color, alpha, (px, py) => ((px - cx) ** 2 + (py - cy) ** 2 <= r * r ? 1 : 0));
  }
  line(ax, ay, bx, by, w, color, alpha) {
    const hw = w / 2, dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy || 1;
    this.paint(Math.min(ax, bx) - hw - 1, Math.min(ay, by) - hw - 1, Math.max(ax, bx) + hw + 1, Math.max(ay, by) + hw + 1, color, alpha, (px, py) => {
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const qx = ax + t * dx, qy = ay + t * dy;
      return (px - qx) ** 2 + (py - qy) ** 2 <= hw * hw ? 1 : 0;
    });
  }
  drawFrame(frame, size, ox, oy) {
    if (!frame) return;
    for (const l of frame.links) {
      const a = frame.dots[l.a], b = frame.dots[l.b];
      if (a && b) this.line(ox + a.x * size, oy + a.y * size, ox + b.x * size, oy + b.y * size, Math.max(0.8, (l.width ?? 0.02) * size), COLOR, l.alpha ?? 0.4);   // dots.js draw 와 같은 최소 굵기
    }
    for (const d of frame.dots) if (d.r > 0) this.circle(ox + d.x * size, oy + d.y * size, d.r * size, COLOR, d.alpha ?? 1);
  }
}

// ---- PNG 인코딩 --------------------------------------------------------------
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = (buf) => { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function toPng(r) {
  const row = r.w * 4;
  const raw = Buffer.alloc((row + 1) * r.h);
  for (let y = 0; y < r.h; y++) { raw[y * (row + 1)] = 0; Buffer.from(r.data.buffer, y * row, row).copy(raw, y * (row + 1) + 1); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(r.w, 0); ihdr.writeUInt32BE(r.h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 굽기 ------------------------------------------------------------------
function bake(v, phase) {
  const p = v[phase];
  if (!p) return null;
  const speed = 1000 / opt.fps;
  const frames = Math.max(1, Math.round(p.duration / speed));
  const px = opt.frame;
  const sheet = new Raster(px, px * frames);
  const framesData = [];
  for (let i = 0; i < frames; i++) {
    const t = phase === 'loop' ? i / frames : i / Math.max(1, frames - 1);
    const f = sample(v, phase, t, 0, { size: px });
    framesData.push(f);
    sheet.drawFrame(f, px, 0, i * px);
  }
  const manifest = { variant: v.id, phase, frames, speed: +speed.toFixed(4), frame: px, fps: opt.fps, file: `${v.id}.${phase}.png` };
  if (phase === 'loop') {
    manifest.seams = (v.loop.seams ?? [0]).map((s) => Math.round(s * frames) % frames);
    manifest.rest = Math.round((v.loop.rest ?? 0) * frames) % frames;
  }
  let contact = null;
  if (opt.contact) {
    const per = 20, S = 2, gap = 4, label = 0;
    const cols = Math.min(per, frames), rows = Math.ceil(frames / per);
    const cw = px * S;
    contact = new Raster(cols * (cw + gap) + gap, rows * (cw + gap + label) + gap);
    if (!BG) contact.fill([31, 30, 29]);
    framesData.forEach((f, i) => contact.drawFrame(f, cw, gap + (i % per) * (cw + gap), gap + Math.floor(i / per) * (cw + gap + label)));
  }
  return { sheet, manifest, contact };
}

mkdirSync(opt.out, { recursive: true });
const targets = target === 'all' ? variants : target.split(',').filter(Boolean).map(get);
const phases = opt.phase === 'all' ? ['enter', 'loop', 'exit'] : [opt.phase];
for (const v of targets) {
  const manifest = { variant: v.id, frame: opt.frame, fps: opt.fps, color: opt.color, phases: {} };
  for (const phase of phases) {
    const r = bake(v, phase);
    if (!r) continue;
    writeFileSync(join(opt.out, r.manifest.file), toPng(r.sheet));
    if (r.contact) writeFileSync(join(opt.out, `${v.id}.${phase}.contact.png`), toPng(r.contact));
    manifest.phases[phase] = r.manifest;
    console.log(`${v.id}.${phase}: ${r.manifest.frames}프레임 → ${join(opt.out, r.manifest.file)}`);
  }
  writeFileSync(join(opt.out, `${v.id}.json`), JSON.stringify(manifest, null, 2));
}
