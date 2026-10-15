// 레이더: 중심에서 뻗은 탐지선이 한 바퀴 돌고, 지나간 자리의 표적이 밝아졌다가 천천히 식는다.

import { polar } from '../easing.js';

const RING = 0.42;
// 표적: [각도(0..1 바퀴), 반지름 비율]
const BLIPS = [[0.08, 0.6], [0.21, 0.35], [0.37, 0.8], [0.52, 0.5], [0.66, 0.25], [0.74, 0.7], [0.9, 0.45]];
const TICKS = 24;

function loop(t) {
  const dots = [], links = [];
  const sweep = 2 * Math.PI * t - Math.PI / 2;
  // 테두리 눈금
  for (let i = 0; i < TICKS; i++) {
    const [x, y] = polar(0.5, 0.5, RING, (2 * Math.PI * i) / TICKS);
    dots.push({ x, y, r: i % 6 === 0 ? 0.014 : 0.008, alpha: 0.35 });
  }
  // 탐지선: 중심 → 테두리. 뒤따르는 옅은 잔상 두 줄
  const c = dots.length;
  dots.push({ x: 0.5, y: 0.5, r: 0.03, alpha: 0.9 });
  for (let k = 0; k < 4; k++) {
    const [x, y] = polar(0.5, 0.5, RING, sweep - k * 0.09);
    dots.push({ x, y, r: 0 });
    links.push({ a: c, b: c + 1 + k, alpha: 0.7 * (1 - k / 4), width: 0.012 });
  }
  // 표적: 탐지선이 지나간 뒤 얼마나 됐는지로 밝기
  for (const [a, rr] of BLIPS) {
    const age = ((t - a) % 1 + 1) % 1; // 0 = 방금 지남
    const glow = Math.exp(-age * 5.5);
    const [x, y] = polar(0.5, 0.5, RING * rr, 2 * Math.PI * a - Math.PI / 2);
    dots.push({ x, y, r: 0.03 + 0.03 * glow, alpha: 0.12 + 0.88 * glow });
  }
  return { dots, links };
}

export default {
  id: 'radar',
  category: 'spin',
  shape: 'circle',
  name: '레이더',
  description: '탐지선이 돌며 지나간 자리의 표적이 밝아졌다가 식는다.',
  tags: ['원형', '선'],
  loop: { duration: 2200, seams: [0], rest: 0, frame: loop },
};
