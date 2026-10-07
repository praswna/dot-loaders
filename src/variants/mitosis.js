// 세포 분열: 한 점이 둘로, 둘이 넷으로 갈라졌다가 다시 하나로 합쳐진다. 넓이가 보존되게 반지름을 줄인다.

import { lerp, seg, easeInOutCubic, easeInOutSine } from '../easing.js';

const R1 = 0.19, R2 = R1 / Math.SQRT2, R4 = R1 / 2;
const D = 0.2;
const C = [0.5, 0.5];

function loop(t) {
  // 0..0.28 가로로 둘로 | 0.28..0.56 세로로 넷으로 | 0.56..0.74 넷이 살짝 돌며 숨쉼 | 0.74..1 중심으로 모여 하나
  const dots = [];
  if (t < 0.28) {
    const s = easeInOutCubic(seg(t, 0.02, 0.28));
    const r = lerp(R1, R2, s), off = D * s;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) dots.push({ x: C[0] + sx * off, y: C[1], r });
  } else if (t < 0.56) {
    const s = easeInOutCubic(seg(t, 0.3, 0.56));
    const r = lerp(R2, R4, s), off = D * s;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) dots.push({ x: C[0] + sx * D, y: C[1] + sy * off, r });
  } else if (t < 0.74) {
    const s = easeInOutSine(seg(t, 0.56, 0.74));
    const rot = (Math.PI / 4) * s, breathe = 1 + 0.08 * Math.sin(Math.PI * s);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const ang = Math.atan2(sy, sx) + rot, d = D * Math.SQRT2;
      dots.push({ x: C[0] + d * Math.cos(ang), y: C[1] + d * Math.sin(ang), r: R4 * breathe });
    }
  } else {
    const s = easeInOutCubic(seg(t, 0.74, 0.98));
    const r = lerp(R4, R1, s), d = D * Math.SQRT2 * (1 - s);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const ang = Math.atan2(sy, sx) + Math.PI / 4;
      dots.push({ x: C[0] + d * Math.cos(ang), y: C[1] + d * Math.sin(ang), r });
    }
  }
  return dots;
}

export default {
  id: 'mitosis',
  name: '세포 분열',
  description: '하나가 둘로, 둘이 넷으로 갈라졌다가 다시 하나로 합쳐진다.',
  tags: ['변신', '유기적'],
  loop: { duration: 3000, seams: [0, 0.74], rest: 0, frame: loop },
};
