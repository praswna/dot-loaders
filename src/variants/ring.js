// 고리 스피너: 열두 점이 둥글게 서고, 밝은 머리가 돌며 꼬리가 옅어진다. iOS 식 스피너.

import { polar } from '../easing.js';

const N = 12, RING = 0.38, R = 0.062;
const TAIL = 7; // 꼬리 길이(점 수)

function loop(t) {
  const head = t * N;
  const dots = [];
  for (let i = 0; i < N; i++) {
    // 머리에서 몇 칸 뒤인지 (0 = 머리). 연속값이라 칸 사이에서도 부드럽다.
    const back = (((head - i) % N) + N) % N;
    const k = back < TAIL ? 1 - back / TAIL : 0;
    const [x, y] = polar(0.5, 0.5, RING, (2 * Math.PI * i) / N - Math.PI / 2);
    dots.push({ x, y, r: R * (0.7 + 0.5 * k), alpha: 0.14 + 0.86 * k * k });
  }
  return dots;
}



export default {
  id: 'ring',
  category: 'spin',
  name: '고리 스피너',
  description: '열두 점 고리를 밝은 머리가 돌며 꼬리를 남긴다.',
  tags: ['원형', '고전'],
  loop: { duration: 1000, seams: Array.from({ length: N }, (_, i) => i / N), rest: 0, frame: loop },
};
