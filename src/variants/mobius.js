// 뫼비우스 띠: 면이 하나, 가장자리도 하나인 띠. 띠가 한 바퀴 도는 동안
// 밝은 점(개미)이 가장자리를 따라 걷는데, 제자리로 돌아오려면 띠를 두 바퀴 돌아야 한다(가장자리 길이 = 중심선의 두 배).
// 매개변수 P(u, v) = ((1 + v cos(u/2)) cos u, (1 + v cos(u/2)) sin u, v sin(u/2)) 에서 u 가 2π 넘어가면 v 가 뒤집힌다.

import { isSmall } from '../easing.js';

const ALONG = 20, W = 0.42, TILT = 1.0, SCALE = 0.29;

function P(u, v) {
  const h = 1 + v * Math.cos(u / 2);
  return [h * Math.cos(u), h * Math.sin(u), v * Math.sin(u / 2)];
}
function view([x, y, z], spin) {              // 띠의 축(z)으로 spin 돌리고, x 축으로 TILT 만큼 기울여 비스듬히 내려다본다
  const c = Math.cos(spin), s = Math.sin(spin);
  [x, y] = [c * x - s * y, s * x + c * y];
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const yy = ct * y - st * z, zz = st * y + ct * z;   // zz: 화면 앞쪽(+) / 뒤쪽(−)
  return { x: 0.5 + SCALE * x, y: 0.5 + SCALE * yy, d: Math.max(0, Math.min(1, 0.5 + zz * 0.4)) };
}

function loop(t, _seam, size) {
  const small = isSmall(size), along = small ? 12 : ALONG, w = small ? 0.035 : 0.01;   // 작게: 가장자리만 굵은 선으로
  const spin = 2 * Math.PI * t, dots = [], links = [];
  for (let i = 0; i < along; i++) {
    const u = (2 * Math.PI * i) / along;
    for (const v of [-W, W]) {
      const q = view(P(u, v), spin);
      dots.push({ x: q.x, y: q.y, r: small ? 0 : 0.016 + 0.012 * q.d, alpha: 0.25 + 0.6 * q.d });
    }
    const a = 2 * i, n = 2 * ((i + 1) % along);
    if (!small) links.push({ a, b: a + 1, width: 0.008, alpha: 0.18 });
    // 마지막 칸은 뒤집혀 이어진다 (v 가 −w ↔ +w)
    if (i < along - 1) { links.push({ a, b: n, width: w, alpha: 0.35 }); links.push({ a: a + 1, b: n + 1, width: w, alpha: 0.35 }); }
    else { links.push({ a, b: 1, width: w, alpha: 0.35 }); links.push({ a: a + 1, b: 0, width: w, alpha: 0.35 }); }
  }
  const ant = view(P(4 * Math.PI * t, W), spin);
  dots.push({ x: ant.x, y: ant.y, r: small ? 0.08 : 0.058 });
  return { dots, links };
}

export default {
  id: 'mobius',
  category: 'science',
  shape: 'free',
  name: '뫼비우스 띠',
  description: '면도 가장자리도 하나뿐인 띠. 가장자리를 걷는 점은 띠를 두 바퀴 돌아야 제자리로 온다.',
  tags: ['위상수학', '3D', '선'],
  loop: { duration: 6000, seams: Array.from({ length: 8 }, (_, i) => i / 8), frame: loop },
};
