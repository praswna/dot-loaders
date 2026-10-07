// 톱니바퀴: 톱니 8개와 6개짜리 바퀴가 맞물려 반대로 돈다. 톱니는 점, 바큇살은 선.
// 한 바퀴(loop)는 큰 바퀴가 톱니 한 칸(1/8 회전) 가는 동안이라 이음새가 매끄럽다.

import { polar } from '../easing.js';

const A = { c: [0.31, 0.5], teeth: 8, r: 0.2 };
const B = { c: [0.665, 0.5], teeth: 6, r: 0.15 };
const TOOTH = 0.045;

function gear(g, angle, scale, alpha, dots, links) {
  const hub = dots.length;
  dots.push({ x: g.c[0], y: g.c[1], r: 0.035 * scale, alpha });
  for (let i = 0; i < g.teeth; i++) {
    const [x, y] = polar(g.c[0], g.c[1], g.r * scale, angle + (2 * Math.PI * i) / g.teeth);
    dots.push({ x, y, r: TOOTH * scale, alpha });
    links.push({ a: hub, b: hub + 1 + i, alpha: 0.25 * alpha, width: 0.01 });
  }
}

function scene(t, scale = 1, alpha = 1) {
  const dots = [], links = [];
  const a = (2 * Math.PI * t) / A.teeth;              // 큰 바퀴: 1/8 회전
  const b = Math.PI + Math.PI / B.teeth - a * (A.teeth / B.teeth); // 작은 바퀴: 반대로, 톱니 사이에 맞물리게
  gear(A, a, scale, alpha, dots, links);
  gear(B, b, scale, alpha, dots, links);
  return { dots, links };
}

const loop = (t) => scene(t);

export default {
  id: 'gears',
  name: '톱니바퀴',
  description: '톱니 8개와 6개짜리 바퀴가 맞물려 반대로 돈다.',
  tags: ['기계', '선', '원형'],
  loop: { duration: 1000, seams: [0], rest: 0, frame: loop },
};
