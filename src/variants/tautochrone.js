// 등시 곡선: 거꾸로 뒤집힌 사이클로이드 그릇에서는 어느 높이에서 놓은 구슬이든 바닥에 같은 시간에 닿는다
// (하위헌스, 1673). 사이클로이드의 호 길이 s = 4R sin(φ/2) 를 쓰면 운동방정식이 s'' = −(g/4R) s,
// 곧 높이와 상관없이 주기가 같은 단진동이 된다. 높이가 다른 구슬 넷이 매번 바닥에서 함께 만난다.

import { isSmall } from '../easing.js';

const R = 0.4 / Math.PI;                       // 그릇 폭 2πR = 0.8
const BASE = 0.7;                              // 바닥 화면 y
const BALL = 0.042;
const START = [0.97, 0.74, 0.5, 0.26];         // 출발 높이 (최대 호 길이 4R 에 대한 비율)

function point(phi) {                          // 사이클로이드 위 점과 그릇 안쪽 법선 (물리 좌표, y 위로)
  const x = R * (phi + Math.sin(phi)), y = R * (1 - Math.cos(phi));
  const nx = -Math.sin(phi), ny = 1 + Math.cos(phi), nl = Math.hypot(nx, ny) || 1;
  return { x, y, nx: nx / nl, ny: ny / nl };
}
const toScreen = (x, y) => [0.5 + x, BASE - y];
const track = (n) => Array.from({ length: n + 1 }, (_, i) => point(-Math.PI + (2 * Math.PI * i) / n));
const TRACK = track(40), TRACK_SMALL = track(12);

function loop(t, _seam, view) {
  const small = isSmall(view);                   // 작게: 그릇 점은 성기고 크게
  const dots = (small ? TRACK_SMALL : TRACK).map(({ x, y }) => { const [sx, sy] = toScreen(x, y); return { x: sx, y: sy, r: small ? 0.02 : 0.008, alpha: 0.35 }; });
  START.forEach((f, i) => {
    const phi = 2 * Math.asin(f * Math.cos(2 * Math.PI * t));   // s = s₀ cos ωt
    const p = point(phi);
    const [x, y] = toScreen(p.x + BALL * p.nx, p.y + BALL * p.ny);
    dots.push({ x, y, r: small ? BALL * 1.3 : BALL, alpha: 1 - i * 0.17 });
  });
  return dots;
}

export default {
  id: 'tautochrone',
  category: 'science',
  shape: 'free',
  name: '등시 곡선',
  description: '사이클로이드 그릇에서는 높이가 달라도 구슬이 바닥에 동시에 닿는다. 하위헌스의 등시 곡선.',
  tags: ['물리', '사이클로이드', '단진동'],
  loop: { duration: 2600, seams: [0, 0.5], rest: 0.25, frame: loop },
};
