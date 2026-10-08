#!/usr/bin/env node
// 변형 보관·꺼내기. 파일을 실제로 옮기고 두 목록(index.js)을 다시 쓴다.
//
//   node tools/archive.mjs archive <id>   src/variants/<id>.js → src/variants/archive/<id>.js
//   node tools/archive.mjs restore <id>   반대로
//   node tools/archive.mjs list           보관된 변형 목록
//   node tools/archive.mjs tidy           두 index.js 를 표준 형식으로 다시 쓰기
//
// 보관된 변형은 라이브러리(src/variants/index.js)에서 빠지고 갤러리의 "보관함" 에만 보인다.
// 개발 서버(tools/serve.mjs)의 /api/archive, /api/restore 도 이 함수를 쓴다.

import { readFile, writeFile, rename, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMPORT = /^import (\w+) from '\.\/([a-z0-9-]+)\.js';$/gm;
const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const paths = (root) => {
  const dir = join(root, 'src', 'variants');
  return { dir, archiveDir: join(dir, 'archive'), active: join(dir, 'index.js'), archived: join(dir, 'archive', 'index.js') };
};
const exists = (p) => access(p).then(() => true, () => false);

async function readIds(file) {
  if (!(await exists(file))) return [];
  const src = await readFile(file, 'utf8');
  return [...src.matchAll(IMPORT)].map((m) => m[2]);
}

function renderList(ids, perLine = 8) {
  const names = ids.map(camel);
  const lines = [];
  for (let i = 0; i < names.length; i += perLine) lines.push('  ' + names.slice(i, i + perLine).join(', ') + ',');
  return lines.join('\n');
}

const activeIndex = (ids) => `// 모든 변형을 등록한다. 새 변형을 만들면 여기에 한 줄 추가.
// 보관(tools/archive.mjs)하면 이 파일이 다시 쓰이니 import 줄 형식(import x from './id.js';)을 지킬 것.
import { register } from '../dots.js';

${ids.map((id) => `import ${camel(id)} from './${id}.js';`).join('\n')}

export const variants = [
${renderList(ids)}
].map(register);

export { categories, categoryOf } from '../categories.js';
export default variants;
`;

const archivedIndex = (ids) => `// 보관함: 갤러리의 "보관함" 에만 보이고 라이브러리(../index.js)에는 들어가지 않는 변형.
// tools/archive.mjs 가 이 파일을 다시 쓴다. import 줄 형식(import x from './id.js';)을 지킬 것.
import { register } from '../../dots.js';

${ids.map((id) => `import ${camel(id)} from './${id}.js';`).join('\n') || '// (비어 있음)'}

export const archived = [${ids.length ? `\n${renderList(ids)}\n` : ''}].map(register);

export default archived;
`;

async function move(root, id, to) {
  if (!ID.test(id)) throw new Error(`잘못된 id: ${id}`);
  const p = paths(root);
  const [active, archived] = [await readIds(p.active), await readIds(p.archived)];
  const [fromList, toList] = to === 'archive' ? [active, archived] : [archived, active];
  const fromFile = to === 'archive' ? join(p.dir, `${id}.js`) : join(p.archiveDir, `${id}.js`);
  const toFile = to === 'archive' ? join(p.archiveDir, `${id}.js`) : join(p.dir, `${id}.js`);
  if (!fromList.includes(id)) throw new Error(`${id} 는 ${to === 'archive' ? '라이브러리' : '보관함'}에 없습니다`);
  if (!(await exists(fromFile))) throw new Error(`파일이 없습니다: ${fromFile}`);
  if (await exists(toFile)) throw new Error(`이미 있습니다: ${toFile}`);
  if (to === 'archive' && fromList.length === 1) throw new Error('마지막 변형은 보관할 수 없습니다');

  // 한 폴더 깊이가 바뀌니 상대 import 를 고친다 ('../x' ↔ '../../x')
  let src = await readFile(fromFile, 'utf8');
  src = to === 'archive' ? src.replace(/from '\.\.\//g, "from '../../") : src.replace(/from '\.\.\/\.\.\//g, "from '../");
  await writeFile(fromFile, src);
  await rename(fromFile, toFile);

  const nextFrom = fromList.filter((x) => x !== id);
  const nextTo = [...toList, id];
  const [nextActive, nextArchived] = to === 'archive' ? [nextFrom, nextTo] : [nextTo, nextFrom];
  await writeFile(p.active, activeIndex(nextActive));
  await writeFile(p.archived, archivedIndex(nextArchived));
  return { id, to, file: toFile.slice(root.length + 1).replaceAll('\\', '/'), active: nextActive, archived: nextArchived };
}

export const archiveVariant = (id, root = DEFAULT_ROOT) => move(root, id, 'archive');
export const restoreVariant = (id, root = DEFAULT_ROOT) => move(root, id, 'restore');
export const archivedIds = (root = DEFAULT_ROOT) => readIds(paths(root).archived);

/** 두 목록 파일을 지금 내용 그대로 표준 형식으로 다시 쓴다. */
export async function rewriteIndexes(root = DEFAULT_ROOT) {
  const p = paths(root);
  await writeFile(p.active, activeIndex(await readIds(p.active)));
  await writeFile(p.archived, archivedIndex(await readIds(p.archived)));
}

// ---- CLI -------------------------------------------------------------------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, id] = process.argv.slice(2);
  try {
    if (cmd === 'tidy') await rewriteIndexes();
    else if (cmd === 'list') console.log((await archivedIds()).join('\n') || '(보관함이 비어 있습니다)');
    else if (cmd === 'archive' || cmd === 'restore') {
      const r = await (cmd === 'archive' ? archiveVariant : restoreVariant)(id);
      console.log(`${id} → ${r.file}`);
    } else {
      console.error('사용법: node tools/archive.mjs archive|restore <id>  |  list');
      process.exit(1);
    }
  } catch (e) { console.error(String(e.message ?? e)); process.exit(1); }
}
