// 모든 변형을 등록한다. 새 변형을 만들면 여기에 한 줄 추가.
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

export const variants = [
  claudeCode, gridRotate, scissor, leapfrog, dice, breathe, orbit, helix, sineWave, constellation,
].map(register);

export default variants;
