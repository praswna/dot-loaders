// 저글링: 공 세 개가 두 손 사이를 포물선으로 오간다(캐스케이드). 손은 공을 받아 안쪽으로 보내며 작은 원을 그린다.

import { lerp } from '../easing.js';

const HAND_Y = 0.74, LX = 0.3, RX = 0.7, H = 0.5;
const FLIGHT = 0.34; // 한 손에서 다른 손까지 나는 시간(공 주기의 비율). 나머지는 손에 머무는 시간
const BALLS = 3, R = 0.065;

// 공 하나의 주기(0..1): 왼손 던짐 → 오른손 착지 → 오른손이 안쪽으로 옮김 → 던짐 → 왼손 착지 → 옮김
function ball(u) {
  const half = u < 0.5 ? u * 2 : (u - 0.5) * 2;
  const fromLeft = u < 0.5;
  const sx = fromLeft ? LX : RX, ex = fromLeft ? RX : LX;
  if (half < FLIGHT) {
    const f = half / FLIGHT;
    // 안쪽에서 던져 바깥쪽에서 받는다
    const x0 = sx + (fromLeft ? 0.08 : -0.08), x1 = ex + (fromLeft ? 0.08 : -0.08);
    return { x: lerp(x0, x1, f), y: HAND_Y - H * 4 * f * (1 - f) - 0.02, r: R, alpha: 1 };
  }
  // 손 안: 바깥쪽에서 안쪽으로, 살짝 아래로 눌렸다가 올라오며 던질 준비
  const g = (half - FLIGHT) / (1 - FLIGHT);
  const x0 = ex + (fromLeft ? 0.08 : -0.08), x1 = ex + (fromLeft ? -0.08 : 0.08);
  return { x: lerp(x0, x1, g), y: HAND_Y + 0.05 * Math.sin(Math.PI * g) - 0.02, r: R, alpha: 1 };
}

function loop(t) {
  const dots = [];
  for (let i = 0; i < BALLS; i++) dots.push(ball(((t + i / BALLS) % 1 + 1) % 1));
  // 손: 공을 받는 리듬(주기의 1/3)으로 작은 원을 그린다. 오른손은 반 박자 늦다
  const hand = (cx, phase) => {
    const a = 2 * Math.PI * (t * BALLS + phase);
    return { x: cx + 0.06 * Math.cos(a), y: HAND_Y + 0.08 + 0.03 * Math.sin(a), r: 0.05, alpha: 0.35 };
  };
  dots.push(hand(LX, 0), hand(RX, 0.5));
  return dots;
}

export default {
  id: 'juggle',
  category: 'physics',
  name: '저글링',
  description: '공 세 개가 두 손 사이를 포물선으로 오간다.',
  tags: ['물리', '포물선'],
  loop: { duration: 2100, seams: [0, 1 / 3, 2 / 3], rest: 0, frame: loop },
};
