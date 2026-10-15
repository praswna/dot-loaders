// 북 막: 가장자리가 고정된 원형 막의 진동 모드 (m=1, n=2). 파동 방정식을 극좌표로 풀면
//   u(r, θ, t) = J₁(k r) · cos(θ − ωt),  k = j₁,₂ = 7.0156 (J₁ 의 두 번째 영점, 가장자리 r=1 에서 u=0)
// 반지름 j₁,₁/j₁,₂ ≈ 0.546 에 움직이지 않는 마디 원이 생기고, 마디 지름이 돌아간다.
// 비스듬히 내려다본 막 위의 점들이 높이(u)만큼 오르내린다. 베셀 함수는 급수로 직접 계산.

import { isSmall } from '../easing.js';

const M = 1, K = 7.0156;
function besselJ(m, x) {                      // Σ (−1)^k (x/2)^{2k+m} / (k!(k+m)!)
  let term = Math.pow(x / 2, m), sum = 0;
  for (let k = 1; k <= m; k++) term /= k;
  for (let k = 0; k < 40; k++) {
    sum += term;
    term *= -(x * x) / 4 / ((k + 1) * (k + 1 + m));
  }
  return sum;
}
const PEAK = besselJ(M, 1.8412);              // J₁ 의 최댓값 (x = 1.8412)

const grid = (rings, count) => rings.flatMap((r, i) => Array.from({ length: count[i] }, (_, j) => ({ r, th: (2 * Math.PI * j) / count[i], J: besselJ(M, K * r) / PEAK })));
const PTS = grid([0, 0.34, 0.67, 1], [1, 8, 14, 20]);
const PTS_SMALL = grid([0, 0.5, 1], [1, 7, 12]);   // 작게: 고리 둘

const R = 0.4, FLAT = 0.5, LIFT = 0.16;
function loop(t, _seam, view) {
  const small = isSmall(view), k = small ? 1.6 : 1;
  const wt = 2 * Math.PI * t;
  return (small ? PTS_SMALL : PTS).map(({ r, th, J }) => {
    const u = J * Math.cos(th - wt);           // −1..1
    return {
      x: 0.5 + R * r * Math.cos(th),
      y: 0.5 + R * FLAT * r * Math.sin(th) - LIFT * u,
      r: k * (0.012 + 0.03 * ((u + 1) / 2) ** 1.5),   // 솟은 곳은 크고 진하게, 꺼진 곳은 작고 옅게
      alpha: 0.15 + 0.85 * (u + 1) / 2,
    };
  });
}

export default {
  id: 'drum',
  category: 'science',
  shape: 'circle',
  name: '북 막',
  description: '원형 북 막의 진동 모드. 베셀 함수 J₁ 이 만든 마디 원은 가만히 있고 마디 지름이 돌아간다.',
  tags: ['원형', '베셀', '파동'],
  loop: { duration: 2400, seams: [0, 0.25, 0.5, 0.75], frame: loop },
};
