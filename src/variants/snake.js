// 스네이크: 4×4 칸을 한 바퀴 도는 해밀턴 경로를 따라 다섯 마디 뱀이 기어간다. 머리가 가장 크다.

import { lerp, seg, easeInOutQuad } from '../easing.js';

// (col,row) 순서. 16칸을 한 번씩 지나 처음으로 돌아온다.
const PATH = [
  [0, 0], [1, 0], [2, 0], [3, 0],
  [3, 1], [2, 1], [1, 1],
  [1, 2], [2, 2], [3, 2],
  [3, 3], [2, 3], [1, 3], [0, 3],
  [0, 2], [0, 1],
];
const STEPS = PATH.length, LEN = 5, CELL = 0.22, OFF = 0.17;
const cellXY = ([c, r]) => [OFF + c * CELL, OFF + r * CELL];

function loop(t) {
  const beat = t * STEPS;
  const step = Math.floor(beat) % STEPS;
  const u = easeInOutQuad(seg(beat - Math.floor(beat), 0.05, 0.85));
  const dots = [];
  for (let j = 0; j < LEN; j++) {
    const k = ((step - j) % STEPS + STEPS) % STEPS;
    const [x0, y0] = cellXY(PATH[k]), [x1, y1] = cellXY(PATH[(k + 1) % STEPS]);
    const head = j === 0;
    dots.push({ x: lerp(x0, x1, u), y: lerp(y0, y1, u), r: head ? 0.085 : 0.075 - j * 0.006, alpha: head ? 1 : 0.9 - j * 0.12 });
  }
  // 빈 칸은 아주 옅게 표시해 격자를 보여 준다
  for (const c of PATH) { const [x, y] = cellXY(c); dots.push({ x, y, r: 0.016, alpha: 0.18 }); }
  return dots;
}

export default {
  id: 'snake',
  category: 'grid',
  shape: 'grid',
  name: '스네이크',
  description: '4×4 격자를 한 바퀴 도는 길을 따라 다섯 마디 뱀이 기어간다.',
  tags: ['4x4', '격자', '게임'],
  loop: { duration: 2400, seams: Array.from({ length: STEPS }, (_, i) => i / STEPS), rest: 0, frame: loop },
};
