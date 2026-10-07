// dot-loaders 엔진.
// 변형(variant)은 "시간 t(0..1) → 점 목록" 함수 묶음이고, 이 파일은 그것을
// 캔버스에 그리고(mount), 다른 플랫폼용으로 스프라이트 시트로 구워 낸다(bakeSpriteSheet).
//
// 좌표계: 한 변이 1 인 정사각형. x, y, r(반지름) 모두 0..1 비율. 색은 하나.
//
// 변형 계약:
//   {
//     id: 'my-loader', name: '이름', description: '설명',
//     loop:  { duration: ms, frame(t) -> dots | {dots, links}, seams?: [t...], rest?: t },
//     enter?: { duration: ms, frame(t) },   // 등장 (없으면 바로 loop)
//     exit?:  { duration: ms, frame(t) },   // 퇴장 (없으면 바로 사라짐)
//   }
//   dots:  [{ x, y, r, alpha? }]
//   links: [{ a, b, alpha?, width? }]  (dots 의 인덱스끼리 선 긋기)
//   seams: 정지 요청이 들어왔을 때 exit 로 넘어가도 어색하지 않은 t 값들 (기본 [0])
//   rest:  모션 축소 설정일 때 멈춰 보여 줄 t (기본 0)

import { clamp01 } from './easing.js';

const registry = new Map();

export function register(variant) {
  if (!variant || typeof variant.id !== 'string') throw new Error('variant.id 가 필요합니다');
  if (!variant.loop || typeof variant.loop.frame !== 'function') {
    throw new Error(`${variant.id}: loop.frame(t) 가 필요합니다`);
  }
  registry.set(variant.id, variant);
  return variant;
}

export function get(id) {
  const v = registry.get(id);
  if (!v) throw new Error(`알 수 없는 변형: ${id}`);
  return v;
}

export function list() {
  return [...registry.values()];
}

const resolve = (v) => (typeof v === 'string' ? get(v) : v);

/** 한 장면을 계산한다. phase 가 없는 변형이면 null. */
export function sample(variant, phase, t) {
  const v = resolve(variant);
  const p = v[phase];
  if (!p) return null;
  const out = p.frame(clamp01(t));
  if (Array.isArray(out)) return { dots: out, links: [] };
  return { dots: out?.dots ?? [], links: out?.links ?? [] };
}

/** 장면 하나를 2D 컨텍스트에 그린다. size 는 픽셀 한 변. */
export function draw(ctx, frame, { size, color = '#d97757', background = null, offsetX = 0, offsetY = 0 } = {}) {
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(offsetX, offsetY, size, size);
  }
  if (!frame) return;
  const { dots, links } = frame;
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.lineCap = 'round';
  for (const l of links) {
    const a = dots[l.a], b = dots[l.b];
    if (!a || !b) continue;
    ctx.globalAlpha = l.alpha ?? 0.4;
    ctx.strokeStyle = color;
    ctx.lineWidth = (l.width ?? 0.02) * size;
    ctx.beginPath();
    ctx.moveTo(a.x * size, a.y * size);
    ctx.lineTo(b.x * size, b.y * size);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  for (const d of dots) {
    if (!(d.r > 0)) continue;
    ctx.globalAlpha = d.alpha ?? 1;
    ctx.beginPath();
    ctx.arc(d.x * size, d.y * size, d.r * size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 캔버스에 로더를 붙인다.
 * target: <canvas> 또는 캔버스를 넣을 부모 요소.
 * options: { variant, size=48, color='#d97757', background=null, speed=1,
 *            autoplay=true, enter=true, reducedMotion='auto'|true|false }
 * 반환: { canvas, state, variant, play(), stop(), pause(), resume(), set(), seek(), onState(), destroy() }
 */
export function mount(target, options = {}) {
  const opts = {
    size: 48, color: '#d97757', background: null, speed: 1,
    autoplay: true, enter: true, reducedMotion: 'auto', ...options,
  };
  let variant = resolve(opts.variant ?? list()[0]?.id);
  if (!variant) throw new Error('등록된 변형이 없습니다 (variants/index.js 를 import 했는지 확인)');

  const canvas = target instanceof HTMLCanvasElement ? target : document.createElement('canvas');
  if (canvas !== target) target.appendChild(canvas);
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');

  let dpr = 1;
  function fit() {
    dpr = Math.max(1, Math.min(4, globalThis.devicePixelRatio || 1));
    canvas.width = Math.round(opts.size * dpr);
    canvas.height = Math.round(opts.size * dpr);
    canvas.style.width = canvas.style.height = `${opts.size}px`;
  }
  fit();

  const mql = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reduced = () => opts.reducedMotion === true || (opts.reducedMotion === 'auto' && !!mql?.matches);

  let state = 'idle';       // idle | enter | loop | exit
  let phaseStart = 0;
  let prevT = 0;
  let raf = 0;
  let stopRequested = false;
  let paused = false;
  let pausedAt = 0;
  const listeners = new Set();

  const render = (frame) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, opts.size, opts.size);
    draw(ctx, frame, { size: opts.size, color: opts.color, background: opts.background });
  };
  const setState = (s, now) => {
    state = s;
    phaseStart = now;
    prevT = 0;
    for (const f of listeners) f(state);
  };
  const durationOf = (phase) => (variant[phase]?.duration ?? 1000) / Math.max(0.01, opts.speed);

  function tick(now) {
    raf = 0;
    if (paused) return;
    if (state === 'idle') { render(null); return; }

    if (reduced()) {
      // 모션 축소: 정지 화면 한 장만
      if (state === 'exit' || stopRequested) { stopRequested = false; setState('idle', now); render(null); return; }
      if (state === 'enter') setState('loop', now);
      render(sample(variant, 'loop', variant.loop.rest ?? 0));
      return;
    }

    const t = (now - phaseStart) / durationOf(state);
    if (state === 'loop') {
      const tl = t % 1;
      if (stopRequested) {
        const seams = variant.loop.seams ?? [0];
        const crossed = seams.some((s) => (prevT <= s && s <= tl) || (prevT > tl && (s >= prevT || s <= tl)));
        if (crossed) {
          stopRequested = false;
          if (variant.exit) { setState('exit', now); render(sample(variant, 'exit', 0)); }
          else { setState('idle', now); render(null); return; }
          raf = requestAnimationFrame(tick);
          return;
        }
      }
      render(sample(variant, 'loop', tl));
      prevT = tl;
    } else if (state === 'enter') {
      if (t >= 1) { setState('loop', now); render(sample(variant, 'loop', 0)); }
      else render(sample(variant, 'enter', t));
    } else if (state === 'exit') {
      if (t >= 1) { setState('idle', now); render(null); return; }
      render(sample(variant, 'exit', t));
    }
    raf = requestAnimationFrame(tick);
  }
  const schedule = () => { if (!raf && !paused) raf = requestAnimationFrame(tick); };
  const cancel = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };

  const api = {
    canvas,
    get state() { return state; },
    get variant() { return variant; },
    get options() { return { ...opts, variant: variant.id }; },

    /** 등장(enter) → 반복(loop). 이미 돌고 있으면 정지 요청만 취소. */
    play({ enter = opts.enter } = {}) {
      stopRequested = false;
      paused = false;
      const now = performance.now();
      if (state === 'idle' || state === 'exit') setState(enter && variant.enter ? 'enter' : 'loop', now);
      schedule();
      return api;
    },
    /** 이음새(seam)에서 퇴장(exit) 후 사라짐. immediate 면 즉시. */
    stop({ immediate = false } = {}) {
      if (state === 'idle') return api;
      if (immediate || !variant.exit) { cancel(); setState('idle', performance.now()); render(null); return api; }
      stopRequested = true;
      paused = false;
      schedule();
      return api;
    },
    pause() { if (paused) return api; paused = true; pausedAt = performance.now(); cancel(); return api; },
    resume() { if (!paused) return api; paused = false; phaseStart += performance.now() - pausedAt; schedule(); return api; },

    /** 옵션 변경. variant/size/color/speed/background 등. */
    set(next = {}) {
      const now = performance.now();
      if (next.speed !== undefined && next.speed !== opts.speed && state !== 'idle') {
        // 속도를 바꿔도 현재 장면이 튀지 않게 시작 시각을 재조정
        const elapsed = (now - phaseStart) / durationOf(state);
        opts.speed = next.speed;
        phaseStart = now - elapsed * durationOf(state);
      }
      if (next.variant !== undefined) {
        variant = resolve(next.variant);
        if (state !== 'idle') setState('loop', now);
      }
      const { variant: _v, ...rest } = next;
      Object.assign(opts, rest);
      if (next.size !== undefined) fit();
      if (state === 'idle') render(null);
      else if (paused) render(sample(variant, state, ((now - phaseStart) / durationOf(state)) % 1));
      else schedule();
      return api;
    },
    /** 특정 장면을 멈춰서 그린다 (디버깅·썸네일용). */
    seek(phase, t) { paused = true; cancel(); render(sample(variant, phase, t)); return api; },
    onState(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    destroy() { cancel(); listeners.clear(); if (canvas !== target) canvas.remove(); },
  };

  if (opts.autoplay) api.play();
  return api;
}

/**
 * 스프라이트 시트 굽기. 프레임을 세로로 쌓은 캔버스와 매니페스트를 돌려준다.
 * WPF·네이티브 앱 등 캔버스가 없는 곳에서 쓰기 위한 것.
 * 재생법: 높이 frame 인 창(clip) 안에서 시트를 -i*frame 만큼 위로 옮기며 speed(ms)마다 i 를 1씩 올린다.
 */
export function bakeSpriteSheet(variant, {
  phase = 'loop', frame = 48, fps = 30, color = '#d97757', background = null, scale = 1,
} = {}) {
  const v = resolve(variant);
  const p = v[phase];
  if (!p) throw new Error(`${v.id}: ${phase} 단계가 없습니다`);
  const speed = 1000 / fps;
  const frames = Math.max(1, Math.round(p.duration / speed));
  const px = Math.round(frame * scale);
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px * frames;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < frames; i++) {
    // loop 는 t=1 이 t=0 과 같으니 마지막 프레임을 빼고, enter/exit 는 끝 장면까지 포함
    const t = phase === 'loop' ? i / frames : i / Math.max(1, frames - 1);
    draw(ctx, sample(v, phase, t), { size: px, color, background, offsetY: i * px });
  }
  const manifest = { variant: v.id, phase, frames, speed: +speed.toFixed(4), frame: px, fps };
  if (phase === 'loop') {
    manifest.seams = (v.loop.seams ?? [0]).map((s) => Math.round(s * frames) % frames);
    manifest.rest = Math.round((v.loop.rest ?? 0) * frames) % frames;
  }
  return { canvas, manifest };
}

/** 캔버스 → PNG Blob */
export function toPngBlob(canvas) {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob 실패'))), 'image/png'));
}
