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
//   exit.frame(t, seam): seam 은 loop 에서 빠져나온 이음새 t. 그 장면에서 이어서 퇴장할 수 있다.
//   frame(t, seam, view): view = { size } 는 그려질 크기(px). 없으면 크다고 본다.
//     작은 크기(isSmall(view), 36px 미만)에서는 점·선을 줄이고 굵혀서 알아보기 쉽게 그려도 된다.
//
// 한 점 규칙: 모든 변형은 "한 점"(POINT, 가운데 작은 점)에서 퍼져 나와 시작하고, 끝날 때는 한 점으로 모인다.
// enter/exit 를 직접 쓰지 않은 변형에는 register 가 공통 전이(gather)를 붙인다. 덕분에
// 한 점 → 변형 A → 한 점 → 변형 B … 처럼 변형 사이를 끊김 없이 순환할 수 있다 (mount 의 variant 배열, loops, dwell).

import { clamp01, lerp, seg, easeInQuad, easeOutQuad, easeOutCubic } from './easing.js';

// ---- 공통 전이: 한 점 ↔ 장면 ------------------------------------------------
/** 모든 변형이 거쳐 가는 한 점. 등장은 여기서 시작하고 퇴장은 여기서 끝난다. */
export const POINT = Object.freeze({ x: 0.5, y: 0.5, r: 0.065 });
const SWELL = 0.14; // 퍼지기 직전 / 모인 직후 부풀어 오르는 반지름
const normalize = (out) => (Array.isArray(out) ? { dots: out, links: [] } : { dots: out?.dots ?? [], links: out?.links ?? [] });

/** 장면(frame)을 한 점 쪽으로 k(0=장면 그대로 .. 1=한 점) 만큼 모은다.
 *  본 점(반지름 0.03 이상)은 한 점으로 합쳐지고, 격자 표시 같은 장식 점은 모이면서 사라진다. */
const isBody = (d) => d.r >= 0.03;
function gather(frame, k, r1 = SWELL) {
  const dots = frame.dots.map((d) => {
    const body = isBody(d), a = d.alpha ?? 1;
    return {
      x: lerp(d.x, POINT.x, k), y: lerp(d.y, POINT.y, k),
      r: d.r > 0 ? lerp(d.r, body ? r1 : 0, k) : 0, alpha: lerp(a, body ? 1 : 0, k),
    };
  });
  const links = frame.links.map((l) => ({ ...l, alpha: (l.alpha ?? 0.4) * (1 - k) }));
  return { dots, links };
}
/** 공통 등장: 작은 점이 부풀었다가 장면으로 퍼진다. */
function genericEnter(loop) {
  return (u, _seam, view) => {
    const frame = normalize(loop.frame(0, 0, view));
    if (u < 0.3) return gather(frame, 1, lerp(POINT.r, SWELL, easeInQuad(u / 0.3)));
    return gather(frame, 1 - easeOutCubic(seg(u, 0.3, 1)));
  };
}
/** 공통 퇴장: 이음새 장면이 가운데로 모여 하나가 되고 작아진다. */
function genericExit(loop) {
  return (u, seam = 0, view) => {
    const frame = normalize(loop.frame(clamp01(seam), 0, view));
    if (u < 0.6) return gather(frame, easeInQuad(u / 0.6));
    return gather(frame, 1, lerp(SWELL, POINT.r, easeOutQuad(seg(u, 0.6, 1))));
  };
}

const registry = new Map();

export function register(variant) {
  if (!variant || typeof variant.id !== 'string') throw new Error('variant.id 가 필요합니다');
  if (!variant.loop || typeof variant.loop.frame !== 'function') {
    throw new Error(`${variant.id}: loop.frame(t) 가 필요합니다`);
  }
  if (!variant.enter) variant.enter = { duration: 500, frame: genericEnter(variant.loop), generic: true };
  if (!variant.exit) variant.exit = { duration: 360, frame: genericExit(variant.loop), generic: true };
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

/** 한 장면을 계산한다. phase 가 없는 변형이면 null. seam 은 exit 가 이어받을 loop 의 이음새 t. */
export function sample(variant, phase, t, seam = 0, view = {}) {
  const v = resolve(variant);
  const p = v[phase];
  if (!p) return null;
  return normalize(p.frame(clamp01(t), seam, view));
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
    ctx.lineWidth = Math.max(0.8, (l.width ?? 0.02) * size);   // 작은 크기에서도 선이 사라지지 않게
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
 *            autoplay=true, enter=true, reducedMotion='auto'|true|false,
 *            loops=1, dwell=0 }
 *   variant 에 배열을 주면 순환한다: 한 점 → A → 한 점 → B → … 각 변형은 loops 바퀴 이상,
 *   dwell ms 이상 돈 뒤 다음 이음새에서 한 점으로 모였다가 다음 변형으로 퍼진다.
 * 반환: { canvas, state, variant, play(), stop(), next(), pause(), resume(), set(), seek(), onState(), destroy() }
 */
export function mount(target, options = {}) {
  const opts = {
    size: 48, color: '#d97757', background: null, speed: 1,
    autoplay: true, enter: true, reducedMotion: 'auto', loops: 1, dwell: 0, ...options,
  };
  let cycle = (Array.isArray(opts.variant) ? opts.variant : [opts.variant ?? list()[0]?.id]).filter(Boolean).map(resolve);
  let variant = cycle[0];
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
  let nextVariant = null;   // 다음 이음새에서 한 점을 거쳐 넘어갈 변형
  let exitSeam = 0;         // exit 가 이어받은 loop 의 이음새 t
  let paused = false;
  let pausedAt = 0;
  const listeners = new Set();
  const after = (v) => cycle[(cycle.indexOf(v) + 1) % cycle.length] ?? v;

  const at = (phase, t, seam = 0) => sample(variant, phase, t, seam, { size: opts.size });
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
      // 모션 축소: 정지 화면 한 장만. 순환 중이면 때가 되었을 때 다음 변형의 정지 화면으로 바꾼다
      if (state === 'exit' || stopRequested) { stopRequested = false; nextVariant = null; setState('idle', now); render(null); return; }
      if (state === 'enter') setState('loop', now);
      const stayed = now - phaseStart;
      if (nextVariant || (cycle.length > 1 && stayed >= Math.max(opts.dwell, durationOf('loop') * opts.loops))) {
        variant = nextVariant ?? after(variant); nextVariant = null; setState('loop', now);
      }
      render(at('loop', variant.loop.rest ?? 0));
      // 순환 중이거나 설정이 바뀔 수 있으니 계속 틱을 돌린다 (정지 화면이라 비용은 작다)
      if (cycle.length > 1 || opts.reducedMotion === 'auto') raf = requestAnimationFrame(tick);
      return;
    }

    const t = (now - phaseStart) / durationOf(state);
    if (state === 'loop') {
      const tl = t % 1;
      // 순환: 바퀴 수(loops)와 머문 시간(dwell)을 채우면 다음 이음새에서 한 점으로 모여 다음 변형으로
      if (!nextVariant && !stopRequested && cycle.length > 1 && t >= opts.loops && now - phaseStart >= opts.dwell) nextVariant = after(variant);
      if (stopRequested || nextVariant) {
        const seams = variant.loop.seams ?? [0];
        const seam = seams.find((s) => (prevT <= s && s <= tl) || (prevT > tl && (s >= prevT || s <= tl)));
        if (seam !== undefined) {
          stopRequested = false;
          exitSeam = seam;
          setState('exit', now);
          render(at('exit', 0, exitSeam));
          raf = requestAnimationFrame(tick);
          return;
        }
      }
      render(at('loop', tl));
      prevT = tl;
    } else if (state === 'enter') {
      if (t >= 1) { setState('loop', now); render(at('loop', 0)); }
      else render(at('enter', t));
    } else if (state === 'exit') {
      if (t >= 1) {
        if (nextVariant) {
          // 한 점에서 다음 변형으로 퍼진다
          variant = nextVariant; nextVariant = null;
          setState('enter', now); render(at('enter', 0));
        } else { setState('idle', now); render(null); return; }
      } else render(at('exit', t, exitSeam));
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

    get cycle() { return cycle.map((v) => v.id); },

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
      nextVariant = null;
      if (immediate || !variant.exit) { cancel(); setState('idle', performance.now()); render(null); return api; }
      stopRequested = true;
      paused = false;
      schedule();
      return api;
    },
    /** 다음 이음새에서 한 점으로 모였다가 다른 변형으로 퍼진다. id 를 주면 그 변형, 없으면 순환 목록의 다음. */
    next(id) {
      const target = id !== undefined ? resolve(id) : after(variant);
      if (state === 'idle') { variant = target; return api.play(); }
      nextVariant = target;
      stopRequested = false;
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
        // 돌고 있는 동안 바꾸면 바로 갈아끼우지 않고 한 점을 거쳐 넘어간다
        cycle = (Array.isArray(next.variant) ? next.variant : [next.variant]).map(resolve);
        if (state === 'idle') variant = cycle[0];
        else if (!cycle.includes(variant)) api.next(cycle[0]);
      }
      const { variant: _v, ...rest } = next;
      Object.assign(opts, rest);
      if (next.size !== undefined) fit();
      if (next.reducedMotion !== undefined && state !== 'idle') { phaseStart = now; prevT = 0; }
      if (state === 'idle') render(null);
      else if (paused) render(at(state, ((now - phaseStart) / durationOf(state)) % 1));
      else schedule();
      return api;
    },
    /** 특정 장면을 멈춰서 그린다 (디버깅·썸네일용). */
    seek(phase, t) { paused = true; cancel(); render(at(phase, t)); return api; },
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
    draw(ctx, sample(v, phase, t, v.loop.rest ?? 0, { size: px }), { size: px, color, background, offsetY: i * px });
  }
  const manifest = { variant: v.id, phase, frames, speed: +speed.toFixed(4), frame: px, fps };
  if (phase === 'exit') manifest.seam = Math.round((v.loop.rest ?? 0) * Math.max(1, Math.round(v.loop.duration / speed)));
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
