// 클라인 병: 안과 밖의 구별이 없는 닫힌 곡면. 3차원에서는 자기 자신을 뚫어야 해서 "8자 몰입"으로 그린다.
//   P(u, v) = ((R + cos(u/2) sin v − sin(u/2) sin 2v) cos u, (…) sin u, sin(u/2) sin v + cos(u/2) sin 2v)
// u 를 한 바퀴(2π) 돌면 v 가 −v 로 뒤집혀서, 곡면을 걷는 구슬은 두 바퀴(4π)를 돌아야 출발점으로 온다.

import { isSmall } from '../easing.js';

const U = 24, V = 6, RR = 2.2, TILT = 0.85, SCALE = 0.126;
function P(u, v) {
  const h = RR + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
  return [h * Math.cos(u), h * Math.sin(u), Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v)];
}

function loop(t, _seam, size) {
  const small = isSmall(size), U_ = small ? 14 : U, V_ = small ? 4 : V;   // 작게: 선 수를 줄이고 굵게, 점은 구슬만
  const spin = 2 * Math.PI * t, c = Math.cos(spin), s = Math.sin(spin), ct = Math.cos(TILT), st = Math.sin(TILT);
  const view = ([x, y, z]) => {
    [x, y] = [c * x - s * y, s * x + c * y];
    const yy = ct * y - st * z, zz = st * y + ct * z;
    return { x: 0.5 + SCALE * x, y: 0.5 + SCALE * yy, d: Math.max(0, Math.min(1, 0.5 + zz * 0.17)) };
  };
  const dots = [], links = [];
  for (let i = 0; i < U_; i++) for (let j = 0; j < V_; j++) {
    const q = view(P((2 * Math.PI * i) / U_, (2 * Math.PI * j) / V_));
    dots.push({ x: q.x, y: q.y, r: small ? 0 : 0.008 + 0.012 * q.d, alpha: 0.2 + 0.6 * q.d });
    // 긴 방향 선. 마지막 칸은 v 가 뒤집혀 처음과 이어진다 (j → −j): 안팎이 없는 이음매
    const next = i < U_ - 1 ? (i + 1) * V_ + j : (V_ - j) % V_;
    links.push({ a: i * V_ + j, b: next, width: small ? 0.035 : 0.009, alpha: (small ? 0.2 : 0.12) + 0.35 * q.d });
  }
  const b = view(P(4 * Math.PI * t, Math.PI / 3));
  dots.push({ x: b.x, y: b.y, r: small ? 0.075 : 0.05 });
  return { dots, links };
}

export default {
  id: 'klein',
  category: 'science',
  shape: 'free',
  name: '클라인 병',
  description: '안팎이 없는 닫힌 곡면(8자 몰입). 곡면을 걷는 구슬은 두 바퀴를 돌아야 제자리로 온다.',
  tags: ['위상수학', '3D', '선'],
  loop: { duration: 7000, seams: Array.from({ length: 8 }, (_, i) => i / 8), frame: loop },
};
