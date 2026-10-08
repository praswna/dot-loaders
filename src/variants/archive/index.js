// 보관함: 갤러리의 "보관함" 에만 보이고 라이브러리(../index.js)에는 들어가지 않는 변형.
// tools/archive.mjs 가 이 파일을 다시 쓴다. import 줄 형식(import x from './id.js';)을 지킬 것.
import { register } from '../../dots.js';

// (비어 있음)

export const archived = [].map(register);

export default archived;
