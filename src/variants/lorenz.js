// 로렌츠 끌개: 대류를 단순화한 방정식 x' = σ(y−x), y' = x(ρ−z) − y, z' = xy − βz (σ=10, ρ=28, β=8/3).
// 혼돈이라 궤적은 영원히 반복하지 않지만, 나비 모양의 끌개 위를 벗어나지도 않는다.
// RK4 로 한 번 적분해 둔 궤적을 옅은 점으로 깔고, 그 위를 구슬 셋이 꼬리를 끌며 달린다.
// 구슬마다 자기 구간을 달리고 사라졌다가 처음으로 돌아오고(밝기 0 일 때 바뀜), 끌개는 좌우로 흔들려 반복이 이어진다.

import { isSmall } from '../easing.js';

const S = 10, RHO = 28, B = 8 / 3, DT = 0.008;
const TRAJ = (() => {
  const f = ([x, y, z]) => [S * (y - x), x * (RHO - z) - y, x * y - B * z];
  let p = [1, 1, 1];
  const step = () => {
    const k1 = f(p), k2 = f(p.map((v, i) => v + (DT / 2) * k1[i])), k3 = f(p.map((v, i) => v + (DT / 2) * k2[i])), k4 = f(p.map((v, i) => v + DT * k3[i]));
    p = p.map((v, i) => v + (DT / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  for (let i = 0; i < 2000; i++) step();       // 끌개에 붙을 때까지 버림
  const out = [];
  for (let i = 0; i < 3600; i++) { step(); out.push(p); }
  return out;
})();
const CLOUD = TRAJ.filter((_, i) => i % 16 === 0), CLOUD_SMALL = TRAJ.filter((_, i) => i % 60 === 0);
const RUN = 900, TRAIL = 14, GAP = 6;          // 구슬 한 번에 달리는 걸음 수, 꼬리 점 수·간격

const pos = (f) => {                           // 걸음 사이를 보간 (구슬이 계단처럼 튀지 않게)
  const i = Math.max(0, Math.min(TRAJ.length - 2, Math.floor(f))), k = Math.max(0, f - i);
  return TRAJ[i].map((v, j) => v + (TRAJ[i + 1][j] - v) * k);
};

const SCALE = 0.0145;
function view([x, y, z], spin) {               // 끌개 축(z)을 세우고 그 둘레로 돌려 본다
  const c = Math.cos(spin), s = Math.sin(spin);
  const xx = c * x - s * y, depth = s * x + c * y;
  return { x: 0.5 + SCALE * xx, y: 0.5 - SCALE * (z - 25), d: Math.max(0, Math.min(1, 0.5 + depth / 50)) };
}

function loop(t, _seam, size) {
  const small = isSmall(size), spin = -Math.PI / 4 + 0.5 * Math.sin(2 * Math.PI * t), dots = [];   // 두 날개(x=y 대각선 위)가 나란히 보이는 쪽을 중심으로 ±30° 흔들며 본다
  for (const p of small ? CLOUD_SMALL : CLOUD) {
    const q = view(p, spin);
    dots.push({ x: q.x, y: q.y, r: small ? 0.016 : 0.006 + 0.005 * q.d, alpha: (small ? 0.3 : 0.2) + 0.3 * q.d });
  }
  for (let b = 0; b < 3; b++) {
    const u = (t + b / 3) % 1, start = b * 1100;      // 구슬마다 다른 구간
    const head = start + u * RUN, fade = Math.sin(Math.PI * u);
    const trail = small ? 5 : TRAIL;
    for (let k = trail; k >= 1; k--) {
      const q = view(pos(head - k * GAP * (small ? 2 : 1)), spin), f = 1 - k / (trail + 1);
      dots.push({ x: q.x, y: q.y, r: small ? 0.022 + 0.02 * f : 0.006 + 0.014 * f, alpha: 0.6 * f * fade });
    }
    const q = view(pos(head), spin);
    dots.push({ x: q.x, y: q.y, r: small ? 0.06 : 0.045, alpha: fade });
  }
  return dots;
}

export default {
  id: 'lorenz',
  category: 'science',
  shape: 'free',
  name: '로렌츠 끌개',
  description: '혼돈 방정식의 나비 모양 끌개. 반복하지 않는 궤적 위를 구슬 셋이 달리고 끌개가 돈다.',
  tags: ['혼돈', 'ODE', '3D'],
  loop: { duration: 9000, seams: Array.from({ length: 6 }, (_, i) => i / 6), frame: loop },
};
