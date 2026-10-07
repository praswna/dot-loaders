// 무한: 점 여섯이 ∞ 곡선(베르누이의 렘니스케이트)을 따라 꼬리를 끌며 달린다.

import { seg, easeOutCubic, easeInQuad } from '../easing.js';

const N = 6, GAP = 0.035, SCALE = 0.4;

function lemniscate(s) {
  const a = 2 * Math.PI * s;
  const d = 1 + Math.sin(a) ** 2;
  return [0.5 + (SCALE * Math.cos(a)) / d, 0.5 + (SCALE * Math.sin(a) * Math.cos(a)) / d];
}

function scene(t, k = 1) {
  const dots = [];
  for (let i = 0; i < N; i++) {
    const [x, y] = lemniscate(t - i * GAP * k);
    const f = 1 - i / N;
    dots.push({ x, y, r: (0.04 + 0.05 * f) * k, alpha: 0.2 + 0.8 * f * f });
  }
  return dots;
}

const loop = (t) => scene(t);
const enter = (u) => scene(0, easeOutCubic(u));
const exit = (u) => scene(0, 1 - easeInQuad(u));

export default {
  id: 'infinity',
  name: '무한',
  description: '점들이 ∞ 곡선을 따라 꼬리를 끌며 달린다.',
  tags: ['곡선', '꼬리'],
  enter: { duration: 350, frame: enter },
  loop: { duration: 2400, seams: [0, 0.5], rest: 0, frame: loop },
  exit: { duration: 300, frame: exit },
};
