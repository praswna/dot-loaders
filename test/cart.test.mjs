// 장바구니 전달문·코드·링크 만들기를 검사한다 (cart.js, DOM 없음).
// 실행: node test/cart.test.mjs   (또는 npm test)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { importName, buildCode, buildHandoff, cartHash, parseCartHash } from '../cart.js';
import { variants } from '../src/variants/index.js';

const byId = new Map(variants.map((v) => [v.id, v]));
const pick = (...ids) => ids.map((id) => byId.get(id));

// ---- 1. 이름·링크 ------------------------------------------------------------
assert.equal(importName('claude-code'), 'claudeCode');
assert.equal(importName('sine-wave'), 'sineWave');
assert.equal(cartHash(['ring', 'snake']), '#cart=ring,snake');
assert.equal(cartHash([]), '');
assert.deepEqual(parseCartHash('#cart=ring,nope,snake,ring', byId), ['ring', 'snake'], '모르는 id 와 중복은 버림');
assert.deepEqual(parseCartHash('#cart=ring%2Csnake', byId), ['ring', 'snake']);
assert.equal(parseCartHash('#other', byId), null);
console.log('ok  import 이름, #cart 링크');

// ---- 2. 코드는 고른 변형만 불러오고, 실제로 돌아간다 ------------------------------
assert.equal(buildCode([]), '');
const one = buildCode(pick('ring'), { base: '.' });
assert.match(one, /variant: 'ring'/);
assert.doesNotMatch(one, /loops/, '하나면 순환 옵션 없음');
const code = buildCode(pick('claude-code', 'sine-wave'), { base: '.', color: '#123456' });
assert.match(code, /import claudeCode from '\.\/src\/variants\/claude-code\.js';/);
assert.match(code, /variant: \['claude-code', 'sine-wave'\]/);
assert.match(code, /color: '#123456', loops: 1/);
assert.doesNotMatch(code, /variants\/index\.js/, '전부 불러오면 안 됨');
assert.match(buildCode(pick('ring'), { base: '.', isArchived: () => true }), /src\/variants\/archive\/ring\.js/);
{
  // 저장소 루트를 base 로 한 코드에서 mount 만 빼고 실행해, import·register 가 실제로 되는지 본다
  const dir = await mkdtemp(join(tmpdir(), 'dl-cart-'));
  try {
    const root = new URL('..', import.meta.url).href.replace(/\/$/, '');
    const body = buildCode(pick('claude-code', 'sine-wave', 'ring'), { base: root })
      .replace(/^const loader = .*$/m, `const { list } = await import('${root}/src/dots.js'); console.log(list().map((v) => v.id).join(','));`);
    await writeFile(join(dir, 'run.mjs'), body);
    assert.equal(execFileSync(process.execPath, [join(dir, 'run.mjs')]).toString().trim(), 'claude-code,sine-wave,ring', '고른 것만 등록되어야 함');
  } finally { await rm(dir, { recursive: true, force: true }); }
}
console.log('ok  코드: 고른 변형만 import·register (실행 확인)');

// ---- 3. 전달문 ------------------------------------------------------------------
assert.equal(buildHandoff([]), '');
const h = buildHandoff(pick('orbit', 'snake'), { ref: 'abc1234', color: '#d97757' });
assert.match(h, /이 변형 2개만 사용/);
assert.match(h, /`orbit` /);
assert.match(h, /#cart=orbit,snake/);
assert.match(h, /cdn\.jsdelivr\.net\/gh\/praswna\/dot-loaders@abc1234\/src\/dots\.js/, '커밋에 고정');
assert.match(h, /- src\/easing\.js\n- src\/variants\/orbit\.js\n- src\/variants\/snake\.js/);
assert.match(h, /node tools\/bake\.mjs orbit,snake --color #d97757/);
console.log('ok  전달문 (목록, 링크, CDN 고정, 파일, 굽기 명령)');

// ---- 4. 굽기 명령이 쉼표 목록을 받는다 -----------------------------------------
{
  const dir = await mkdtemp(join(tmpdir(), 'dl-bake-'));
  try {
    const bakeJs = new URL('../tools/bake.mjs', import.meta.url).pathname;
    execFileSync(process.execPath, [bakeJs, 'ring,dice', '--phase', 'loop', '--frame', '16', '--out', dir]);
    assert.deepEqual((await readdir(dir)).sort(), ['dice.json', 'dice.loop.png', 'ring.json', 'ring.loop.png']);
  } finally { await rm(dir, { recursive: true, force: true }); }
}
console.log('ok  tools/bake.mjs ring,dice');

console.log('모두 통과');
