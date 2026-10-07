// 불꽃놀이: 포탄이 올라가 터지고, 불티 열두 개가 퍼지며 중력에 끌려 내려앉다 꺼진다.

import { lerp, seg, easeOutCubic } from '../easing.js';

const SPARKS = 12, BURST = 0.32, APEX = [0.5, 0.36];

function loop(t) {
  const dots = [];
  if (t < BURST) {
    const u = easeOutCubic(t / BURST);
    const y = lerp(0.95, APEX[1], u);
    dots.push({ x: 0.5, y, r: 0.045 * (1 - 0.3 * u), alpha: 1 });
    // 올라온 길의 연기 꼬리
    for (let k = 1; k <= 3; k++) dots.push({ x: 0.5, y: y + 0.07 * k, r: 0.02, alpha: Math.max(0, 0.4 - 0.12 * k) * (1 - u) });
  } else {
    const u = seg(t, BURST, 1);
    const spread = 0.36 * (1 - Math.exp(-u * 4));    // 공기 저항으로 멈춤
    const drop = 0.14 * u * u;                         // 중력
    const fade = Math.max(0, 1 - Math.pow(u, 1.6));
    for (let i = 0; i < SPARKS; i++) {
      const a = (2 * Math.PI * i) / SPARKS + 0.2 * Math.sin(i * 1.7); // 살짝 비뚤게
      const wobble = 1 + 0.12 * Math.sin(i * 2.3);
      dots.push({ x: APEX[0] + spread * wobble * Math.cos(a), y: APEX[1] + spread * wobble * Math.sin(a) + drop, r: 0.035 * (1 - 0.6 * u), alpha: fade });
    }
    // 터지는 순간의 섬광
    const flash = Math.max(0, 1 - u * 6);
    dots.push({ x: APEX[0], y: APEX[1], r: 0.12 * flash, alpha: 0.9 * flash });
  }
  // 바닥에서 대기 중인 다음 포탄(알파 0 으로 좌표만 유지해 점 수를 안정시킴)
  dots.push({ x: 0.5, y: 0.95, r: 0.03, alpha: t < BURST ? 0 : 0.5 * seg(t, 0.85, 1) });
  return dots;
}

export default {
  id: 'firework',
  name: '불꽃놀이',
  description: '포탄이 올라가 터지고 불티가 퍼지며 내려앉는다.',
  tags: ['물리', '폭발'],
  loop: { duration: 2200, seams: [0], rest: 0, frame: loop },
};
