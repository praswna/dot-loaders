// 주사위: 점들이 1→2→3→4→5→6 눈 모양으로 차례로 바뀐다. 남는 점은 같은 자리에 겹쳐 하나처럼 보인다.

import { lerp, seg, easeInOutCubic } from '../easing.js';

const a = 0.25, m = 0.5, z = 0.75;
const FACES = [
  [[m, m]],
  [[a, a], [z, z]],
  [[a, a], [m, m], [z, z]],
  [[a, a], [z, a], [a, z], [z, z]],
  [[a, a], [z, a], [m, m], [a, z], [z, z]],
  [[a, a], [z, a], [a, m], [z, m], [a, z], [z, z]],
];
const SLOTS = 6;
const R = 0.075;

function loop(t) {
  const beat = t * FACES.length;
  const k = Math.floor(beat) % FACES.length;
  const u = beat - Math.floor(beat);
  const from = FACES[k], to = FACES[(k + 1) % FACES.length];
  const s = easeInOutCubic(seg(u, 0.15, 0.6));
  const dots = [];
  for (let i = 0; i < SLOTS; i++) {
    const p = from[i % from.length], q = to[i % to.length];
    dots.push({ x: lerp(p[0], q[0], s), y: lerp(p[1], q[1], s), r: R * (1 + 0.15 * Math.sin(Math.PI * s)) });
  }
  return dots;
}

export default {
  id: 'dice',
  name: '주사위',
  description: '점이 주사위 눈 1부터 6까지 차례로 변한다.',
  tags: ['3x3', '변신'],
  loop: { duration: 4200, seams: [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6], frame: loop },
};
