#!/usr/bin/env node
// 배포 직전에 상대 경로 모듈 주소 끝에 ?v=<커밋> 을 붙인다 (pages.yml 에서 실행).
// GitHub Pages 는 모든 파일을 10분 캐시해서, 새 app.js 가 캐시에 남은 옛 src/*.js 를 불러오면
// 없는 export 때문에 페이지가 통째로 깨질 수 있다. 커밋마다 주소가 달라지면 한 버전끼리만 묶인다.
//
//   node tools/stamp.mjs <version> [dir=.]
//
// 바꾸는 것: 줄 맨 앞의 import/export … from './x.js', import './x.js', 그리고 <script src="./x.js">.
// (./ 또는 ../ 로 시작하는 .js 만. 문자열 속 예시 코드나 주석은 줄 맨 앞이 아니라 그대로 둔다)

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const STATEMENT = /^(\s*(?:(?:import|export)\b[^'"\n]*?\bfrom|import)\s*["'])(\.{1,2}\/[^"'?#\n]+\.js)(["'])/gm;
const SCRIPT = /(<script\b[^>]*\bsrc=["'])(\.{1,2}\/[^"'?#]+\.js)(["'])/g;

export const stamp = (text, version) => {
  const add = (_, a, path, b) => `${a}${path}?v=${version}${b}`;
  return text.replace(STATEMENT, add).replace(SCRIPT, add);
};

export function stampDir(dir, version) {
  const changed = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(m?js|html)$/.test(e.name)) {
        const before = readFileSync(p, 'utf8');
        const after = stamp(before, version);
        if (after !== before) { writeFileSync(p, after); changed.push(p); }
      }
    }
  };
  walk(dir);
  return changed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [version, dir = '.'] = process.argv.slice(2);
  if (!version || !/^[\w.-]+$/.test(version)) { console.error('사용법: node tools/stamp.mjs <version> [dir]'); process.exit(1); }
  console.log(`${stampDir(dir, version).length}개 파일의 모듈 주소에 ?v=${version}`);
}
