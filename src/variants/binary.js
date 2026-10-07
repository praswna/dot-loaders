// 이진 카운터: 네 점이 0000 부터 1111 까지 센다. 켜진 비트는 진하고, 바뀌는 순간 통 튄다.

import { seg, easeOutBack } from '../easing.js';

const BITS = 4, R = 0.08, Y = 0.5;
const X = (i) => 0.2 + 0.2 * i;

function loop(t) {
  const beat = t * 16;
  const n = Math.floor(beat) % 16;
  const u = beat - Math.floor(beat);
  const prev = (n + 15) % 16;
  const dots = [];
  for (let i = 0; i < BITS; i++) {
    const bit = BITS - 1 - i;                 // 왼쪽이 높은 자리
    const on = (n >> bit) & 1, was = (prev >> bit) & 1;
    const pop = on !== was ? easeOutBack(seg(u, 0, 0.35)) : 1;
    const k = was + (on - was) * pop;         // 0..1 켜짐 정도
    dots.push({ x: X(i), y: Y - 0.04 * k, r: R * (0.75 + 0.25 * k) * (on !== was ? 0.85 + 0.15 * pop : 1), alpha: 0.18 + 0.82 * k });
  }
  // 자릿값 표시: 아래쪽 작은 점 1,2,4,8 개
  for (let i = 0; i < BITS; i++) {
    const count = 1 << (BITS - 1 - i);
    for (let k = 0; k < count; k++) {
      const col = k % 4, row = Math.floor(k / 4);
      dots.push({ x: X(i) - 0.045 + col * 0.03, y: 0.68 + row * 0.03, r: 0.008, alpha: 0.3 });
    }
  }
  return dots;
}

export default {
  id: 'binary',
  name: '이진 카운터',
  description: '네 점이 0000 부터 1111 까지 센다.',
  tags: ['가로', '숫자'],
  loop: { duration: 3200, seams: Array.from({ length: 16 }, (_, i) => i / 16), rest: 0, frame: loop },
};
