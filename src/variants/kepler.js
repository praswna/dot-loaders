// 케플러: 태양(초점)을 도는 행성 둘. 바깥 행성은 이심률 0.6 의 길쭉한 타원이라 가까울 때 빠르고 멀 때 느리다
// (제2법칙, 같은 시간에 같은 넓이 — 태양에서 행성까지의 선이 그 넓이를 쓴다).
// 위치는 케플러 방정식 M = E − e sin E 를 뉴턴법으로 풀어 구한다.
// 안쪽 행성은 공전 주기가 절반이라 제3법칙(T² ∝ a³)에 따라 긴반지름이 2^(−2/3) 배. 2:1 공명이라 한 바퀴가 이어진다.

import { isSmall } from '../easing.js';

const SUN = [0.64, 0.5];
const PLANETS = [
  { a: 0.34, e: 0.6, turn: 0, n: 1, r: 0.048 },
  { a: 0.34 * Math.pow(2, -2 / 3), e: 0.25, turn: 2.3, n: 2, r: 0.036 },
];

function solveE(M, e) {                       // 뉴턴법
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}
function place({ a, e, turn }, E) {           // 초점(태양) 기준 위치, 근일점이 turn 방향
  const b = a * Math.sqrt(1 - e * e);
  const x = a * (Math.cos(E) - e), y = b * Math.sin(E);
  const c = Math.cos(turn), s = Math.sin(turn);
  return [SUN[0] + c * x - s * y, SUN[1] + s * x + c * y];
}

const orbitDots = (n) => PLANETS.map((p) => Array.from({ length: n }, (_, i) => place(p, (2 * Math.PI * i) / n)));
const PATHS = orbitDots(40), PATHS_SMALL = orbitDots(14);

function loop(t, _seam, view) {
  const small = isSmall(view);                   // 작게: 궤도 점은 성기고 크게, 반지름 선은 굵게
  const dots = [];
  for (const path of small ? PATHS_SMALL : PATHS) for (const [x, y] of path) dots.push({ x, y, r: small ? 0.018 : 0.007, alpha: small ? 0.35 : 0.25 });
  dots.push({ x: SUN[0], y: SUN[1], r: 0.072 });
  const sun = dots.length - 1, links = [];
  for (const p of PLANETS) {
    const [x, y] = place(p, solveE(2 * Math.PI * p.n * t, p.e));
    dots.push({ x, y, r: small ? p.r * 1.35 : p.r });
    if (p.n === 1) links.push({ a: sun, b: dots.length - 1, width: small ? 0.035 : 0.012, alpha: 0.35 });
  }
  return { dots, links };
}

export default {
  id: 'kepler',
  category: 'science',
  shape: 'free',
  name: '케플러',
  description: '태양을 도는 두 행성. 케플러 방정식을 뉴턴법으로 풀어 가까울 때 빠르고 멀 때 느리다. 2:1 공명.',
  tags: ['중력', '타원', '뉴턴법'],
  loop: { duration: 6000, seams: Array.from({ length: 12 }, (_, i) => i / 12), frame: loop },
};
