// 양자 진동자: 2차원 조화 진동자 퍼텐셜 속 입자의 확률밀도 |ψ(x, y, t)|² 를 7×7 점의 크기·밝기로.
// 고유상태 세 개의 겹침:
//   ψ = a·φ(0,0) + b·φ(m=+1) e^{-iωt}·… + c·φ(n_r=1, m=0) e^{-2iωt}  (에너지 ω, 2ω, 3ω 이므로 상대 위상만 남김)
// 각운동량 m=+1 성분이 덩어리를 돌리고, 지름 방향 들뜬 상태가 숨 쉬듯 부풀었다 오므린다.
// 에너지 간격이 모두 ω 의 정수배라 2π/ω 마다 정확히 같은 모양이 된다.

import { isSmall } from '../easing.js';

const N = 7, GAP = 0.12, L = 2.6;           // 점 수, 화면 간격, 물리 좌표 반폭
const A = 0.62, B = 0.62, C = 0.48;         // 겹침 계수

function psi(x, y, wt) {
  const r2 = x * x + y * y, g = Math.exp(-r2 / 2);
  // φ00 ∝ g, φ(m=+1) ∝ (x+iy)g, φ(n_r=1,m=0) ∝ (r²-1)g  (정규화 상수는 계수에 흡수)
  const re = A * g + B * g * (x * Math.cos(wt) + y * Math.sin(wt)) + C * (r2 - 1) * g * Math.cos(2 * wt);
  const im = B * g * (y * Math.cos(wt) - x * Math.sin(wt)) - C * (r2 - 1) * g * Math.sin(2 * wt);
  return re * re + im * im;
}

const coord = (n, i) => -L + (2 * L * i) / (n - 1);
const maxFor = (n) => {                      // 한 주기 동안의 최댓값으로 정규화
  let m = 0;
  for (let s = 0; s < 64; s++) for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) m = Math.max(m, psi(coord(n, i), coord(n, j), (2 * Math.PI * s) / 64));
  return m;
};
const MAX = { [N]: maxFor(N), 5: maxFor(5) };

function loop(t, _seam, view) {
  const n = isSmall(view) ? 5 : N, gap = (GAP * (N - 1)) / (n - 1);   // 작게: 5×5, 같은 넓이
  const wt = 2 * Math.PI * t, dots = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const p = Math.min(1, psi(coord(n, i), -coord(n, j), wt) / MAX[n]);
    const k = Math.sqrt(p);                  // 넓이가 확률에 비례하게
    dots.push({ x: 0.5 + (i - (n - 1) / 2) * gap, y: 0.5 + (j - (n - 1) / 2) * gap, r: (0.012 + 0.046 * k) * (n === N ? 1 : 1.3), alpha: 0.18 + 0.82 * k });
  }
  return dots;
}

export default {
  id: 'quantum',
  category: 'science',
  shape: 'grid',
  name: '양자 진동자',
  description: '2차원 조화 진동자 속 입자의 확률밀도. 고유상태 셋이 겹쳐 덩어리가 돌며 숨 쉰다.',
  tags: ['7x7', '격자', '슈뢰딩거'],
  loop: {
    duration: 2800,
    seams: [0, 0.25, 0.5, 0.75],
    frame: loop,
  },
};
