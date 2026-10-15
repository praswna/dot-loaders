// 배포용 모듈 주소 꼬리표(tools/stamp.mjs)를 검사한다: 실제 갤러리 사본에 붙이고 브라우저 없이 모듈 그래프를 따라간다.
// 실행: node test/stamp.test.mjs   (또는 npm test)
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { stamp, stampDir } from '../tools/stamp.mjs';

// ---- 1. 바꿀 것과 안 바꿀 것 --------------------------------------------------------
assert.equal(stamp(`import { a } from './a.js';`, 'abc'), `import { a } from './a.js?v=abc';`);
assert.equal(stamp(`import "../b/c.js";`, 'abc'), `import "../b/c.js?v=abc";`);
assert.equal(stamp(`export { x } from './e.js';\nexport * from "./f.js";`, 'abc'), `export { x } from './e.js?v=abc';\nexport * from "./f.js?v=abc";`);
assert.equal(stamp(`<script type="module" src="./app.js"></script>`, 'abc'), `<script type="module" src="./app.js?v=abc"></script>`);
for (const keep of [
  `import x from 'https://cdn.example/x.js';`,          // 바깥 주소
  `import fs from 'node:fs';`,
  'const s = `import x from \'${base}/src/dots.js\';`;', // cart.js 가 만드는 글 안의 코드
  `fetch('./version.json')`,
  `import a from './a.js?v=old';`,                       // 이미 붙은 것
  "const code = `import { mount } from './src/dots.js';\\nimport './src/variants/index.js';`;",  // 복사용 예시 문자열
  `// import 줄 형식(import x from './id.js';)을 지킬 것`,  // 주석
]) assert.equal(stamp(keep, 'abc'), keep, keep);
console.log('ok  꼬리표 붙이기 규칙');

// ---- 2. 실제 갤러리 사본: 모든 상대 import 가 같은 꼬리표를 달고 실제 파일을 가리킨다 -----------
{
  const root = new URL('..', import.meta.url).pathname;
  const dir = await mkdtemp(join(tmpdir(), 'dl-stamp-'));
  try {
    for (const f of ['index.html', 'app.js', 'cart.js', 'src']) await cp(join(root, f), join(dir, f), { recursive: true });
    const changed = stampDir(dir, 'e9559ca');
    assert.ok(changed.length > 15, `바뀐 파일 수 ${changed.length}`);
    assert.equal(stampDir(dir, 'e9559ca').length, 0, '두 번 돌려도 그대로');
    // index.html 에서 출발해 import 를 따라가며, 꼬리표 없는 상대 import 와 없는 파일이 없는지
    const seen = new Set(), queue = [join(dir, 'index.html')];
    while (queue.length) {
      const file = queue.shift();
      if (seen.has(file)) continue;
      seen.add(file);
      const text = await readFile(file, 'utf8');
      for (const [, spec] of text.matchAll(/(?:^\s*(?:(?:import|export)\b[^'"\n]*?\bfrom|import)\s*|<script\b[^>]*\bsrc=)["'](\.{1,2}\/[^"']+)["']/gm)) {
        assert.match(spec, /\.js\?v=e9559ca$/, `${file}: ${spec}`);
        queue.push(join(dirname(file), spec.replace(/\?.*$/, '')));
      }
    }
    assert.ok(seen.size > 30, `따라간 파일 ${seen.size}개`);
    // 복사용 예시 코드에는 꼬리표가 붙지 않는다
    assert.doesNotMatch(await readFile(join(dir, 'app.js'), 'utf8'), /\\nimport '\.\/src\/variants\/index\.js\?v=/);
    assert.match(await readFile(join(dir, 'cart.js'), 'utf8'), /from '\.\/dot-loaders\/src\/dots\.js';/);
    // node 로도 그대로 불러와진다 (?v= 는 같은 파일, 같은 모듈 인스턴스)
    const m = await import(join(dir, 'src/variants/index.js'));
    assert.ok(m.variants.length > 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
console.log('ok  갤러리 사본: index.html 부터 모든 모듈이 같은 꼬리표');
console.log('모두 통과');
