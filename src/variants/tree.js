// 프랙털 나무: 가지 하나가 자기를 닮은 작은 가지 둘로 갈라지기를 되풀이한다(길이 비 0.68).
// 갈라지는 각도가 18°~42° 사이를 오가며 나무 전체가 숨 쉬듯 펼쳐졌다 오므리고,
// 바람이 위로 갈수록 크게(깊이에 비례해) 흔든다. 각도·바람 모두 정수 주기라 한 바퀴가 이어진다.

import { isSmall } from '../easing.js';

const RATIO = 0.68, TRUNK = 0.24;

function loop(t, _seam, view) {
  const small = isSmall(view), depth = small ? 4 : 6;     // 작게: 4단까지, 굵게
  const spread = (30 + 12 * Math.sin(2 * Math.PI * t)) * (Math.PI / 180);
  const wind = 0.07 * Math.sin(2 * Math.PI * 2 * t + 0.6);
  const dots = [{ x: 0.5, y: 0.9, r: 0.036, alpha: 0.8 }], links = [];   // 뿌리 (한 점으로 모일 때 이 점이 남는다)
  const grow = (from, x, y, ang, len, level) => {
    const a = ang + wind * level;
    const nx = x + len * Math.sin(a), ny = y - len * Math.cos(a);
    const leaf = level === depth;
    dots.push({ x: nx, y: ny, r: leaf ? (small ? 0.045 : 0.022) : small ? 0.012 : 0.01 + 0.01 * (1 - level / depth), alpha: leaf ? 1 : 0.6 });
    const me = dots.length - 1;
    links.push({ a: from, b: me, width: (small ? 0.05 : 0.026) * Math.pow(0.72, level - 1), alpha: 0.55 });
    if (!leaf) { grow(me, nx, ny, a - spread, len * RATIO, level + 1); grow(me, nx, ny, a + spread, len * RATIO, level + 1); }
  };
  grow(0, 0.5, 0.9, 0, TRUNK, 1);
  return { dots, links };
}

export default {
  id: 'tree',
  category: 'science',
  shape: 'free',
  name: '프랙털 나무',
  description: '가지가 자기를 닮은 가지 둘로 갈라지기를 되풀이한다. 갈래 각이 숨 쉬고 바람이 끝가지를 흔든다.',
  tags: ['프랙털', '재귀', '선'],
  loop: { duration: 5000, seams: [0, 0.25, 0.5, 0.75], frame: loop },
};
