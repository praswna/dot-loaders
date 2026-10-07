// 모래시계: 위 삼각형의 모래알 여섯이 목을 지나 아래로 떨어지고, 다 떨어지면 통째로 뒤집힌다.

import { lerp, seg, easeInQuad, easeOutQuad, easeInOutCubic } from '../easing.js';

const R = 0.045;
const NECK = [0.5, 0.5];
// 위: 아래쪽(목 쪽)부터 비워진다. 아래: 바닥부터 채워진다.
const TOP = [[0.5, 0.41], [0.44, 0.31], [0.56, 0.31], [0.38, 0.21], [0.5, 0.21], [0.62, 0.21]];
const BOTTOM = [[0.38, 0.79], [0.5, 0.79], [0.62, 0.79], [0.44, 0.69], [0.56, 0.69], [0.5, 0.59]];
const GLASS = [[0.24, 0.1], [0.76, 0.1], [0.24, 0.9], [0.76, 0.9]];
const FALL_END = 0.74, FLIP_START = 0.78;

function rotate([x, y], a) {
  const dx = x - 0.5, dy = y - 0.5;
  return [0.5 + dx * Math.cos(a) - dy * Math.sin(a), 0.5 + dx * Math.sin(a) + dy * Math.cos(a)];
}

function loop(t) {
  const flip = t < FLIP_START ? 0 : Math.PI * easeInOutCubic(seg(t, FLIP_START, 1));
  const grains = TOP.map((top, i) => {
    const s0 = 0.03 + i * 0.1, s1 = s0 + 0.2; // 각 알의 낙하 구간
    if (t <= s0) return top;
    if (t >= s1) return BOTTOM[i];
    const u = seg(t, s0, s1);
    if (u < 0.45) { const v = easeInQuad(u / 0.45); return [lerp(top[0], NECK[0], v), lerp(top[1], NECK[1], v)]; }
    const v = easeOutQuad(seg(u, 0.45, 1));
    return [lerp(NECK[0], BOTTOM[i][0], v), lerp(NECK[1], BOTTOM[i][1], v)];
  });
  const dots = grains.map((p) => { const [x, y] = rotate(p, flip); return { x, y, r: R }; });
  const g0 = dots.length;
  for (const p of GLASS) { const [x, y] = rotate(p, flip); dots.push({ x, y, r: 0.012, alpha: 0.5 }); }
  const links = [
    { a: g0, b: g0 + 1 }, { a: g0 + 2, b: g0 + 3 }, { a: g0, b: g0 + 3 }, { a: g0 + 1, b: g0 + 2 },
  ].map((l) => ({ ...l, alpha: 0.28, width: 0.012 }));
  return { dots, links };
}

export default {
  id: 'hourglass',
  name: '모래시계',
  description: '모래알이 목을 지나 떨어지고, 다 떨어지면 통째로 뒤집힌다.',
  tags: ['물리', '선', '변신'],
  loop: { duration: 3600, seams: [0], rest: 0, frame: loop },
};
