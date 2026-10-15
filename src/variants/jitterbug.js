// 지터버그: 버크민스터 풀러의 변환. 정삼각형 8장의 모서리 길이를 그대로 둔 채 비틀면
// 육팔면체 → 정이십면체 → 정팔면체로 접힌다. 꼭짓점은 (0, ±a, ±b) 의 순환 순열이고,
// 삼각형 변의 길이가 변하지 않으려면 a² + b² − ab = 1. a=1 이면 육팔면체, b/a = 황금비면 정이십면체, a=0 이면 정팔면체.

import { isSmall } from '../easing.js';

const PHI = (1 + Math.sqrt(5)) / 2;
// 삼각형마다 꼭짓점 셋: 팔분면 부호 (sx, sy, sz) 에서 (0, sy·a, sz·b), (sx·b, 0, sz·a), (sx·a, sy·b, 0)
const SIGNS = [];
for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1]) SIGNS.push([sx, sy, sz]);

const TILT = 0.5, SCALE = 0.25;
function loop(t, _seam, view) {
  const small = isSmall(view);
  const a = (1 + Math.cos(2 * Math.PI * t)) / 2;            // 1 → 0 → 1 (가는 길과 오는 길에 정이십면체를 한 번씩)
  const b = (a + Math.sqrt(4 - 3 * a * a)) / 2;             // a² + b² − ab = 1
  const spin = 2 * Math.PI * t, c = Math.cos(spin), s = Math.sin(spin), ct = Math.cos(TILT), st = Math.sin(TILT);
  const proj = ([x, y, z]) => {
    [x, z] = [c * x + s * z, -s * x + c * z];
    const yy = ct * y - st * z, zz = st * y + ct * z;
    return { x: 0.5 + SCALE * x, y: 0.5 + SCALE * yy, d: Math.max(0, Math.min(1, 0.5 + zz * 0.35)) };
  };
  const dots = [], links = [];
  for (const [sx, sy, sz] of SIGNS) {
    const base = dots.length;
    for (const p of [[0, sy * a, sz * b], [sx * b, 0, sz * a], [sx * a, sy * b, 0]]) {
      const q = proj(p);
      dots.push({ x: q.x, y: q.y, r: small ? 0.04 : 0.026 + 0.018 * q.d, alpha: 0.35 + 0.65 * q.d });
    }
    const d = (dots[base].alpha + dots[base + 1].alpha + dots[base + 2].alpha) / 3;
    for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) links.push({ a: base + i, b: base + j, width: small ? 0.04 : 0.015, alpha: 0.15 + 0.45 * d });
  }
  return { dots, links };
}

export default {
  id: 'jitterbug',
  category: 'science',
  shape: 'free',
  name: '지터버그',
  description: '정삼각형 8장이 변 길이를 지키며 비틀려 육팔면체 → 정이십면체 → 정팔면체로 접혔다 펴진다.',
  tags: ['다면체', '3D', '선'],
  loop: { duration: 5000, seams: [0, 0.5], frame: loop },
};
