// 모든 변형을 등록한다. 새 변형을 만들면 여기에 한 줄 추가.
// 보관(tools/archive.mjs)하면 이 파일이 다시 쓰이니 import 줄 형식(import x from './id.js';)을 지킬 것.
import { register } from '../dots.js';

import claudeCode from './claude-code.js';
import gridRotate from './grid-rotate.js';
import scissor from './scissor.js';
import leapfrog from './leapfrog.js';
import dice from './dice.js';
import breathe from './breathe.js';
import orbit from './orbit.js';
import helix from './helix.js';
import sineWave from './sine-wave.js';
import constellation from './constellation.js';
import typing from './typing.js';
import ring from './ring.js';
import cradle from './cradle.js';
import mitosis from './mitosis.js';
import hourglass from './hourglass.js';
import snake from './snake.js';
import glider from './glider.js';
import juggle from './juggle.js';
import radar from './radar.js';
import gears from './gears.js';
import infinity from './infinity.js';
import firework from './firework.js';
import pong from './pong.js';
import binary from './binary.js';
import morse from './morse.js';
import galaxy from './galaxy.js';
import interference from './interference.js';

export const variants = [
  claudeCode, gridRotate, scissor, leapfrog, dice, breathe, orbit, helix,
  sineWave, constellation, typing, ring, cradle, mitosis, hourglass, snake,
  glider, juggle, radar, gears, infinity, firework, pong, binary,
  morse, galaxy, interference,
].map(register);

export { categories, categoryOf } from '../categories.js';
export default variants;
