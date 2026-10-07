// 개구리 뛰기: 한 줄 네 점 중 맨 왼쪽이 포물선을 그리며 맨 오른쪽으로 뛰어넘고, 나머지는 한 칸씩 밀린다.

import { lerp, easeInOutQuad, easeInOutCubic } from '../easing.js';

const SLOT = 0.2;
const X0 = 0.2;
const R = 0.07;

function loop(t) {
  const hop = easeInOutQuad(t);
  const shift = easeInOutCubic(t) * SLOT;
  const arc = Math.sin(Math.PI * t);
  const dots = [{
    x: lerp(X0, X0 + 3 * SLOT, hop),
    y: 0.5 - 0.28 * arc,
    r: R * (1 + 0.3 * arc),
  }];
  for (let i = 1; i < 4; i++) dots.push({ x: X0 + i * SLOT - shift, y: 0.5, r: R });
  return dots;
}

export default {
  id: 'leapfrog',
  name: '개구리 뛰기',
  description: '맨 뒤 점이 앞으로 뛰어넘고 줄이 한 칸 당겨진다. 끝없이 전진하는 느낌.',
  tags: ['가로', '점프'],
  loop: { duration: 600, seams: [0], frame: loop },
};
