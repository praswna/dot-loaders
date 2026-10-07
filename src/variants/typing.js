// 입력 중: 채팅 앱의 "상대가 입력 중" 표시. 세 점이 차례로 통통 튀고, 바닥에 있을 때는 옅어진다.

import { lerp, seg, easeOutBack, easeInQuad } from '../easing.js';

const N = 3, R = 0.085, Y = 0.56, HOP = 0.17;
const X = (i) => 0.22 + 0.28 * i;

function loop(t) {
  const dots = [];
  for (let i = 0; i < N; i++) {
    const u = (((t - i * 0.14) % 1) + 1) % 1;       // 점마다 위상 차
    const h = u < 0.42 ? Math.sin((Math.PI * u) / 0.42) : 0; // 0..1 포물선 같은 도약
    dots.push({ x: X(i), y: Y - HOP * h, r: R * (1 + 0.1 * h), alpha: 0.4 + 0.6 * h });
  }
  return dots;
}

function enter(u) {
  const dots = [];
  for (let i = 0; i < N; i++) {
    const s = easeOutBack(seg(u, i * 0.18, i * 0.18 + 0.5));
    dots.push({ x: X(i), y: Y, r: R * s, alpha: 0.4 + 0.6 * s });
  }
  return dots;
}

function exit(u) {
  const s = easeInQuad(u);
  return Array.from({ length: N }, (_, i) => ({ x: X(i), y: Y + 0.15 * s, r: R * (1 - s), alpha: 1 - s }));
}

export default {
  id: 'typing',
  name: '입력 중',
  description: '채팅 "입력 중" 표시. 세 점이 차례로 튀어 오른다.',
  tags: ['가로', '고전'],
  enter: { duration: 500, frame: enter },
  loop: { duration: 1100, seams: [0], rest: 0, frame: loop },
  exit: { duration: 260, frame: exit },
};
