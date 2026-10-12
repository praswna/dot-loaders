// 장바구니: 갤러리에서 고른 변형만 다른 프로젝트로 넘길 때 쓰는 글을 만든다.
// DOM 을 쓰지 않는 순수 함수만 둔다(test/cart.test.mjs 에서 node 로 검사).

const REPO = 'praswna/dot-loaders';
const SITE = 'https://praswna.github.io/dot-loaders/';

// 'claude-code' → 'claudeCode' (import 이름)
export const importName = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

// 변형 파일 경로 (보관함에 있으면 archive/ 아래)
export const variantPath = (v, archived = false) => `src/variants/${archived ? 'archive/' : ''}${v.id}.js`;

// URL 해시 #cart=a,b,c ↔ id 목록. 모르는 id 는 버린다.
export const cartHash = (ids) => (ids.length ? `#cart=${ids.join(',')}` : '');
export function parseCartHash(hash, known) {
  const m = /(?:^#|&)cart=([^&]*)/.exec(hash || '');
  if (!m) return null;
  const ids = decodeURIComponent(m[1]).split(',').map((s) => s.trim()).filter(Boolean);
  return [...new Set(ids)].filter((id) => !known || known.has(id));
}

// 웹에서 쓰는 코드: 고른 변형만 import·register 하고 mount 한다.
// base 는 dot-loaders 의 위치(복사한 폴더 또는 CDN 주소). 끝에 / 없이.
export function buildCode(items, { base = './dot-loaders', size = 20, color = '#d97757', isArchived = () => false } = {}) {
  if (!items.length) return '';
  const lines = [`import { mount, register } from '${base}/src/dots.js';`];
  for (const v of items) lines.push(`import ${importName(v.id)} from '${base}/${variantPath(v, isArchived(v.id))}';`);
  lines.push('', `[${items.map((v) => importName(v.id)).join(', ')}].forEach(register);`, '');
  const variant = items.length === 1 ? `'${items[0].id}'` : `[${items.map((v) => `'${v.id}'`).join(', ')}]`;
  const cycle = items.length > 1 ? ', loops: 1, dwell: 3000' : '';
  lines.push(`const loader = mount(document.querySelector('#loader'), { variant: ${variant}, size: ${size}, color: '${color}'${cycle} });`);
  lines.push('// loader.stop();  // 이음새에서 한 점으로 모인 뒤 사라짐');
  if (items.length > 1) lines.push('// loader.next();  // 다음 변형으로 (한 점을 거쳐)');
  return lines.join('\n');
}

// 다른 프로젝트(사람이든 AI 든)에 그대로 붙여 넣을 전달문.
// ref 는 CDN 에 고정할 커밋(없으면 main).
export function buildHandoff(items, { size = 20, color = '#d97757', ref = 'main', isArchived = () => false } = {}) {
  if (!items.length) return '';
  const ids = items.map((v) => v.id);
  const cdn = `https://cdn.jsdelivr.net/gh/${REPO}@${ref}`;
  const files = ['src/dots.js', 'src/easing.js', ...items.map((v) => variantPath(v, isArchived(v.id)))];
  const out = [
    `# dot-loaders: 이 변형 ${items.length}개만 사용`,
    '',
    ...items.map((v) => `- \`${v.id}\` ${v.name}${v.description ? ` — ${v.description}` : ''}${isArchived(v.id) ? ' (보관함)' : ''}`),
    '',
    `미리 보기: ${SITE}${cartHash(ids)}`,
    `저장소: https://github.com/${REPO}${ref !== 'main' ? ` (커밋 ${ref})` : ''}`,
    `크기 ${size}px, 색 ${color}${items.length > 1 ? ', 변형마다 1바퀴·3초 이상 돈 뒤 한 점을 거쳐 다음으로 순환' : ''}`,
    '',
    '## 웹 (ES 모듈, CDN)',
    '```js',
    buildCode(items, { base: cdn, size, color, isArchived }),
    '```',
    '',
    '## 파일을 복사해 쓸 때 (이것만 있으면 됨)',
    ...files.map((f) => `- ${f}`),
    `위 코드의 주소를 복사한 폴더 경로로 바꾼다. 예: \`import { mount, register } from './dot-loaders/src/dots.js';\``,
    '',
    '## 네이티브 앱: 스프라이트 시트',
    '```bash',
    `node tools/bake.mjs ${ids.join(',')} --color ${color} --out dist`,
    '```',
    'enter 한 번 → loop 반복 → 멈출 때 seams 중 하나에서 exit 한 번. 자세한 재생법은 저장소 README 의 "네이티브 앱" 절.',
  ];
  return out.join('\n');
}
