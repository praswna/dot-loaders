// 수소 오비탈: 3d_z² 전자의 확률밀도 |ψ|² ∝ r⁴ e^{−2r/3} (3cos²θ − 1)² 에서 점 구름을 뽑아 3차원으로 돌린다.
// 위아래 두 덩어리와 가운데 고리(도넛)가 이 오비탈의 모양. 점은 고정된 씨앗으로 기각 표집해서 매번 같다.
// 오비탈은 z 축 대칭이라, 기울인 채 z 축으로 한 바퀴 도는 동안 모양이 달라 보이지 않고 점들만 흘러간다.

import { isSmall } from '../easing.js';

function rng(seed) {                         // mulberry32
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const density = (x, y, z) => {
  const r2 = x * x + y * y + z * z, r = Math.sqrt(r2);
  const ang = r2 ? 3 * (z * z) / r2 - 1 : 0;
  return r2 * r2 * Math.exp((-2 * r) / 3) * ang * ang;
};
const CLOUD = (() => {
  const rand = rng(7), out = [], B = 16;
  let peak = 0;
  for (let i = 0; i < 4000; i++) peak = Math.max(peak, density((rand() * 2 - 1) * B, (rand() * 2 - 1) * B, (rand() * 2 - 1) * B));
  while (out.length < 150) {
    const x = (rand() * 2 - 1) * B, y = (rand() * 2 - 1) * B, z = (rand() * 2 - 1) * B;
    if (rand() * peak * 1.05 < density(x, y, z)) out.push([x, y, z]);
  }
  const m = out.map((p) => Math.hypot(...p)).sort((a, b) => a - b)[Math.floor(out.length * 0.92)];   // 바깥 8% 는 화면 끝에 걸치게
  return out.map((p) => p.map((v) => v / m));
})();

const TILT = 0.3, SCALE = 0.36;
function loop(t, _seam, view) {
  const small = isSmall(view), cloud = small ? CLOUD.slice(0, 50) : CLOUD;   // 작게: 점 수를 줄이고 크게
  const a = 2 * Math.PI * t, c = Math.cos(a), s = Math.sin(a), ct = Math.cos(TILT), st = Math.sin(TILT);
  const dots = [{ x: 0.5, y: 0.5, r: small ? 0.05 : 0.034, alpha: 1 }];   // 원자핵
  for (const [x0, y0, z0] of cloud) {
    const x = c * x0 - s * y0, y = s * x0 + c * y0;
    // z 를 화면 위쪽으로 세우고 살짝 앞으로 기울임
    const sy = -(ct * z0 - st * y), depth = st * z0 + ct * y;
    const d = Math.max(0, Math.min(1, 0.5 + depth * 0.5));
    dots.push({ x: 0.5 + SCALE * x, y: 0.5 + SCALE * sy, r: small ? 0.022 + 0.014 * d : 0.006 + 0.01 * d, alpha: 0.25 + 0.65 * d });
  }
  return dots;
}

export default {
  id: 'orbital',
  category: 'science',
  shape: 'free',
  name: '3d 오비탈',
  description: '수소 원자 3d_z² 전자의 확률 구름. 위아래 두 덩어리와 가운데 도넛이 천천히 돈다.',
  tags: ['양자', '3D', '구름'],
  loop: { duration: 7000, seams: [0, 0.25, 0.5, 0.75], frame: loop },
};
