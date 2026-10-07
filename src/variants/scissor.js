// 가위질: 두 대각선 짝이 동시에 반대 방향으로 90도 돈다.
// 한 짝은 바깥으로 부풀며, 다른 짝은 안쪽으로 오므리며 돌아 서로 스쳐 지나간다.

import { seg, easeInOutCubic, polar } from '../easing.js';

const RAD = 0.348;
const R = 0.09;
const Q = Math.PI / 2;

function loop(t) {
  const s = easeInOutCubic(seg(t, 0, 0.65));
  const bulge = Math.sin(Math.PI * s);
  const out = RAD * (1 + 0.22 * bulge);
  const inn = RAD * (1 - 0.5 * bulge);
  // 화면 각도(y 아래 +): TL 225°, TR 315°, BR 45°, BL 135°
  const a = [
    polar(0.5, 0.5, out, Math.PI * 1.25 + Q * s), // TL → BL (시계 반대)
    polar(0.5, 0.5, out, Math.PI * 0.25 + Q * s), // BR → TR
    polar(0.5, 0.5, inn, Math.PI * 1.75 - Q * s), // TR → TL (시계)
    polar(0.5, 0.5, inn, Math.PI * 0.75 - Q * s), // BL → BR
  ];
  return a.map(([x, y], i) => ({ x, y, r: i < 2 ? R * (1 + 0.1 * bulge) : R * (1 - 0.15 * bulge) }));
}

export default {
  id: 'scissor',
  name: '가위질',
  description: '대각선 두 짝이 반대 방향으로 동시에 돈다. 한 짝은 바깥, 한 짝은 안쪽으로 비껴 지나감.',
  tags: ['2x2', '회전'],
  loop: { duration: 900, seams: [0], frame: loop },
};
