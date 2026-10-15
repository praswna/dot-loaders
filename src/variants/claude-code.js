// claude.ai Code 탭의 대기 표시(WorkingMark, 'code' 활동) 재현.
// 원본은 48px 프레임 PNG 스프라이트 시트(30fps)이고, 이 파일은 그 시트에서 뽑은 좌표를
// 수식으로 다시 쓴 것이다. 수치 근거: docs/claude-code-mark-frames.md
//
// 동작: 네 점이 2×2 로 선다. 대각선 짝(TL↔BR) 두 점이 S자 곡선을 그리며 서로 자리를 바꾸고,
// 이어서 다른 대각선 짝(TR↔BL)이 좌우 반전된 같은 동작을 한다. 이것을 두 번 반복해 2.5초 한 바퀴.
// 등장: 작은 점이 커지다 넷으로 갈라져 모서리로 퍼짐. 퇴장: 넷이 모여 하나가 되고 작아짐.

import { lerp, seg, easeInQuad, easeOutQuad, easeOutCubic, cubicBezier } from '../easing.js';

const C = 0.5;        // 중심
const D = 0.246;      // 모서리까지 거리 (48px 기준 11.8px)
const R = 0.094;      // 점 반지름 (48px 기준 4.5px)
const TL = [C - D, C - D], TR = [C + D, C - D], BL = [C - D, C + D], BR = [C + D, C + D];

// TL→BR 경로. 시트의 19프레임 좌표에 최소제곱으로 맞춘 3차 베지에(최대 오차 0.8px/48px).
// 중심 왼쪽 아래를 스치듯 지나 아래 변 바깥으로 살짝 불룩하게 돌아 BR 로 들어간다.
const PATH = [[0.256, 0.256], [0.340, 0.465], [0.479, 0.940], [0.748, 0.748]];
const pointFlip = (p) => [1 - p[0], 1 - p[1]]; // 점대칭 → 짝꿍(BR→TL)
const mirrorX = (p) => [1 - p[0], p[1]];       // 좌우 반전 → 다른 대각선(TR→BL)
const PATHS = {
  TLBR: PATH,
  BRTL: PATH.map(pointFlip),
  TRBL: PATH.map(mirrorX),
  BLTR: PATH.map(mirrorX).map(pointFlip),
};

// 시트에서 읽은 진행 곡선: 39% 시점에 거리의 48% 를 지난다. 빠르게 들어가서 천천히 안착.
function progress(u) {
  return u < 0.39
    ? 0.48 * Math.pow(u / 0.39, 1.8)
    : 0.48 + 0.52 * (1 - Math.pow(1 - (u - 0.39) / 0.61, 2.6));
}
const onPath = (path, s) => cubicBezier(path[0], path[1], path[2], path[3], s);
const dot = ([x, y], r) => ({ x, y, r });

function loop(t) {
  const beat = t * 4;
  const move = Math.floor(beat) % 4;
  const u = beat - Math.floor(beat);
  const s = progress(u);
  const even = move % 2 === 0;
  const moving = even
    ? [onPath(PATHS.TLBR, s), onPath(PATHS.BRTL, s)]
    : [onPath(PATHS.TRBL, s), onPath(PATHS.BLTR, s)];
  const still = even ? [TR, BL] : [TL, BR];
  const rMoving = R + 0.006 * Math.sin(Math.PI * u); // 움직일 때 아주 살짝 커짐
  return [dot(moving[0], rMoving), dot(moving[1], rMoving), dot(still[0], R), dot(still[1], R)];
}

function enter(u) {
  if (u < 0.44) {
    // 작은 점(r 3.1px)이 잠시 있다가 7px 까지 부풀어 오름
    const g = easeInQuad(seg(u, 0.125, 0.40));
    return [dot([C, C], lerp(0.065, 0.146, g))];
  }
  // 넷으로 갈라져 모서리로 ease-out
  const v = easeOutCubic(seg(u, 0.44, 0.85));
  const off = lerp(0.14, D, v);
  const r = lerp(0.079, R, v);
  return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => dot([C + sx * off, C + sy * off], r));
}

function exit(u) {
  if (u < 0.44) {
    // 가속하며 중심으로
    const g = easeInQuad(u / 0.44);
    const off = lerp(D, 0.155, g);
    const r = lerp(R, 0.08, g);
    return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => dot([C + sx * off, C + sy * off], r));
  }
  // 하나로 합쳐진 뒤 작아짐
  const g = easeOutQuad(seg(u, 0.44, 0.9));
  return [dot([C, C], lerp(0.144, 0.065, g))];
}

export default {
  id: 'claude-code',
  category: 'swap',
  shape: '2x2',
  name: 'Claude code 마크',
  description: 'claude.ai Code 탭 대기 표시 재현. 대각선 짝이 S자로 자리를 바꾼다 (TL↔BR, TR↔BL 번갈아).',
  tags: ['재현', '2x2'],
  enter: { duration: 533, frame: enter },
  loop: { duration: 2500, seams: [0, 0.25, 0.5, 0.75], rest: 0, frame: loop },
  exit: { duration: 300, frame: exit },
};
