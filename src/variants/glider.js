// 글라이더: 콘웨이의 생명 게임. 5×5 토러스 위를 글라이더 하나가 기어가 20세대 만에 제자리로 돌아온다.
// 세대는 모듈을 읽을 때 미리 계산한다. 태어나는 칸은 커지고 죽는 칸은 작아진다.

import { seg, easeOutBack, easeInQuad } from '../easing.js';

const N = 5, GENS = 20, CELL = 0.19, OFF = 0.12;
const key = (x, y) => `${(x + N) % N},${(y + N) % N}`;
function step(s) {
  const next = new Set();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let c = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && s.has(key(x + dx, y + dy))) c++;
    const alive = s.has(key(x, y));
    if ((alive && (c === 2 || c === 3)) || (!alive && c === 3)) next.add(key(x, y));
  }
  return next;
}
const HISTORY = [new Set(['1,0', '2,1', '0,2', '1,2', '2,2'])];
for (let i = 1; i < GENS; i++) HISTORY.push(step(HISTORY[i - 1]));

const R_ALIVE = 0.07, R_DEAD = 0.018;

function loop(t) {
  const beat = t * GENS;
  const g = Math.floor(beat) % GENS;
  const u = beat - Math.floor(beat);
  const prev = HISTORY[(g + GENS - 1) % GENS], cur = HISTORY[g];
  const dots = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = key(x, y), was = prev.has(k), is = cur.has(k);
    let r = R_DEAD, alpha = 0.2;
    if (is && was) { r = R_ALIVE; alpha = 1; }
    else if (is) { const s = easeOutBack(seg(u, 0, 0.45)); r = R_DEAD + (R_ALIVE - R_DEAD) * s; alpha = 0.2 + 0.8 * s; }
    else if (was) { const s = easeInQuad(seg(u, 0, 0.4)); r = R_ALIVE + (R_DEAD - R_ALIVE) * s; alpha = 1 - 0.8 * s; }
    dots.push({ x: OFF + x * CELL, y: OFF + y * CELL, r, alpha });
  }
  return dots;
}

export default {
  id: 'glider',
  name: '글라이더',
  description: '콘웨이 생명 게임의 글라이더가 5×5 토러스를 기어간다. 20세대에 한 바퀴.',
  tags: ['5x5', '격자', '세포자동자'],
  loop: { duration: 4000, seams: Array.from({ length: GENS }, (_, i) => i / GENS), rest: 0, frame: loop },
};
