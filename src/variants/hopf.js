// 홉프 올뭉치: 3차원 구면 S³ 을 2차원 구면 S² 의 점마다 원(올) 하나씩으로 가른다.
// S² 의 적도 근처에 고르게 놓은 점 넷의 올 네 개를 입체 투영으로 3차원에 옮기면,
// 서로 한 번씩 고리처럼 꿰인 원 넷이 원환면을 감싼다(빌라르소 원).
// z₁ 에 e^{−iα} 를 곱하는 회전은 올 집합을 자기 자신으로 보내므로, 90° 돌면 같은 모양 → 반복 한 바퀴.

import { isSmall } from '../easing.js';

const FIBERS = 4, PER = 14, LAT = 0.1;        // 올 수, 올마다 점 수, 밑점의 높이 c
const TILT = 0.55;                            // 원환면의 대칭축(z)에서 조금 비껴 본다

function fiberPoint(lon, th, alpha) {
  // 밑점 (a, b, c) = (√(1−c²) cos lon, √(1−c²) sin lon, c) 의 올: e^{iθ}(√((1+c)/2), (a+ib)/√(2(1+c)))
  const c = LAT, s = Math.sqrt(1 - c * c);
  const m1 = Math.sqrt((1 + c) / 2), m2 = s / Math.sqrt(2 * (1 + c));
  const p1 = th - alpha, p2 = th + lon;
  const x0 = m1 * Math.cos(p1), x1 = m1 * Math.sin(p1), x2 = m2 * Math.cos(p2), x3 = m2 * Math.sin(p2);
  const k = 1 / (1 - x3);                       // 입체 투영 (북극 x3=1 에서)
  return [x0 * k, x1 * k, x2 * k];
}

const SCALE = (() => {                          // 모든 각도에서 화면 안에 들도록
  let m = 0;
  for (let f = 0; f < FIBERS; f++) for (let j = 0; j < 64; j++) {
    const [x, y, z] = fiberPoint((2 * Math.PI * f) / FIBERS, (2 * Math.PI * j) / 64, 0);
    m = Math.max(m, Math.hypot(x, y, z));
  }
  return 0.38 / m;
})();

// 입체 투영은 원 위의 간격을 한쪽으로 몰아서, 점을 3차원 호 길이로 고르게 다시 놓는다.
// 시작 위상을 α 로 두면 90° 회전 뒤 올 f 의 시작점이 올 f+1 의 시작점과 겹쳐 반복이 이어진다.
function evenFiber(lon, alpha, per = PER) {
  const D = 96, pts = [], acc = [0];
  for (let j = 0; j <= D; j++) pts.push(fiberPoint(lon, alpha + (2 * Math.PI * j) / D, alpha));
  for (let j = 1; j <= D; j++) acc.push(acc[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1], pts[j][2] - pts[j - 1][2]));
  const out = [];
  for (let k = 0, j = 0; k < per; k++) {
    const want = (acc[D] * k) / per;
    while (acc[j + 1] < want) j++;
    const f = (want - acc[j]) / (acc[j + 1] - acc[j] || 1);
    out.push(pts[j].map((v, i) => v + (pts[j + 1][i] - v) * f));
  }
  return out;
}

function loop(t, _seam, view) {
  const small = isSmall(view), per = small ? 9 : PER;   // 작게: 원은 굵은 선으로, 점은 구슬만
  const alpha = (t * 2 * Math.PI) / FIBERS;
  const dots = [], links = [];
  const c = Math.cos(TILT), s = Math.sin(TILT);
  for (let f = 0; f < FIBERS; f++) {
    const base = dots.length;
    evenFiber((2 * Math.PI * f) / FIBERS, alpha, per).forEach(([x, y, z], j) => {
      const yy = c * y - s * z, zz = s * y + c * z;   // 비스듬히 보기 (x 축 회전)
      const d = Math.max(0, Math.min(1, 0.5 + zz * SCALE * 1.3));
      const bead = j === 0;                            // 올마다 구슬 하나: 원을 따라 흐르는 방향이 보이게
      dots.push({ x: 0.5 + SCALE * x, y: 0.5 + SCALE * yy, r: bead ? (small ? 0.065 : 0.042) : small ? 0 : 0.01 + 0.018 * d, alpha: bead ? 1 : 0.35 + 0.65 * d });
      links.push({ a: base + j, b: base + ((j + 1) % per), width: small ? 0.04 : 0.013, alpha: (small ? 0.35 : 0.25) + 0.45 * d });
    });
  }
  return { dots, links };
}

export default {
  id: 'hopf',
  category: 'science',
  shape: 'circle',
  name: '홉프 올뭉치',
  description: 'S³ 을 원으로 가른 홉프 올 넷을 3차원에 투영했다. 서로 한 번씩 꿰인 원들이 돌아간다.',
  tags: ['위상수학', '4D', '선'],
  loop: { duration: 5200, seams: [0, 0.5], frame: loop },
};
