// 2×2 네 점이 하나의 네모처럼 90도씩 돌아간다. 살짝 넘쳤다 돌아오는(overshoot) 느낌.

import { seg, easeOutBack, polar } from '../easing.js';

const BEATS = 4;
const RAD = 0.348;   // 중심에서 모서리까지
const R = 0.09;

function loop(t) {
  const beat = t * BEATS;
  const k = Math.floor(beat);
  const u = beat - k;
  const spin = seg(u, 0, 0.6);
  const ang = (k + easeOutBack(spin)) * (Math.PI / 2);
  const r = R * (1 + 0.12 * Math.sin(Math.PI * spin));
  return [0, 1, 2, 3].map((i) => {
    const [x, y] = polar(0.5, 0.5, RAD, Math.PI / 4 + (i * Math.PI) / 2 + ang);
    return { x, y, r };
  });
}

export default {
  id: 'grid-rotate',
  category: 'swap',
  shape: '2x2',
  name: '네모 회전',
  description: '2×2 가 통째로 90도씩 돈다. 살짝 넘쳤다가 제자리.',
  tags: ['2x2', '회전'],
  loop: { duration: 2400, seams: [0, 0.25, 0.5, 0.75], frame: loop },
};
