// 갤러리 페이지. 엔진과 변형을 불러와 카드로 늘어놓는다.
import { mount, bakeSpriteSheet, toPngBlob } from './src/dots.js';
import { variants, categories } from './src/variants/index.js';
import { archived as archivedVariants } from './src/variants/archive/index.js';
import { shapes } from './src/categories.js';
import { buildHandoff, buildCode, cartHash, parseCartHash } from './cart.js';

const $ = (sel) => document.querySelector(sel);
const toastEl = $('#toast');
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

// ---- 테마 ---------------------------------------------------------------
const root = document.documentElement;
function applyTheme(t) {
  root.dataset.theme = t;
  try { localStorage.setItem('dot-loaders.theme', t); } catch {}
}
let theme = 'light';
try { theme = localStorage.getItem('dot-loaders.theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch {}
applyTheme(theme);

// ---- 모션 축소 ------------------------------------------------------------
// OS 설정이 켜져 있으면 엔진은 정지 화면만 그린다. 갤러리에서는 알려 주고, 원하면 이 페이지에서만 무시한다.
const reduceMql = matchMedia('(prefers-reduced-motion: reduce)');
let ignoreReduce = false;
try { ignoreReduce = localStorage.getItem('dot-loaders.ignoreReduce') === '1'; } catch {}
const reducedMotionOpt = () => (ignoreReduce ? false : 'auto');
function syncMotionUI() {
  const on = reduceMql.matches;
  $('#motionNotice').hidden = !on;
  $('#motion').checked = ignoreReduce;
}

// ---- 카드 ----------------------------------------------------------------
const global = { size: 72, speed: 1, color: '#d97757' };
const cards = [];

// 장바구니: 고른 변형 id (담은 순서). 이 브라우저에 기억하고, #cart=a,b 링크로 넘길 수 있다.
let cart = [];
try { cart = JSON.parse(localStorage.getItem('dot-loaders.cart') || '[]'); } catch {}
let versionHash = null;   // version.json 이 있으면 CDN 주소를 그 커밋에 고정

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function bake(v) {
  const frame = 48, fps = 30;
  const phases = ['enter', 'loop', 'exit'].filter((p) => v[p]);
  const manifest = { variant: v.id, frame, fps, color: global.color, phases: {} };
  for (const phase of phases) {
    const { canvas, manifest: m } = bakeSpriteSheet(v, { phase, frame, fps, color: global.color });
    manifest.phases[phase] = { ...m, file: `${v.id}.${phase}.png` };
    download(await toPngBlob(canvas), `${v.id}.${phase}.png`);
  }
  download(new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }), `${v.id}.json`);
  toast(`${v.id}: ${phases.join(', ')} 시트 ${phases.length}장 + json 내려받음`);
}

function makeCard(v) {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="stage">
      <div class="big"></div>
      <div class="mini"><div class="mini-canvas"></div><span>20px</span></div>
    </div>
    <h2><span>${v.name}</span><code>${v.id}</code></h2>
    <p>${v.description ?? ''}</p>
    <div class="meta">
      ${(v.tags ?? []).map((t) => `<span class="tag">${t}</span>`).join('')}
      <span class="tag">loop ${v.loop.duration}ms</span>
      <span class="tag" title="${v.enter.generic ? '공통 전이: 한 점에서 퍼짐' : '변형 고유 등장'}">enter ${v.enter.duration}ms${v.enter.generic ? ' ·' : ''}</span>
      <span class="tag" title="${v.exit.generic ? '공통 전이: 한 점으로 모임' : '변형 고유 퇴장'}">exit ${v.exit.duration}ms${v.exit.generic ? ' ·' : ''}</span>
    </div>
    <div class="actions">
      <button data-act="play" title="등장 → 반복">▶</button>
      <button data-act="stop" title="이음새에서 퇴장">■</button>
      <button data-act="bake" title="PNG 스프라이트 시트 + json 내려받기">PNG 시트</button>
      <button data-act="copy" title="mount 호출 코드 복사">코드 복사</button>
      <button data-act="cart" class="cart-btn"></button>
      <button data-act="archive" class="archive-btn"></button>
      <span class="state"></span>
    </div>`;
  const big = mount(card.querySelector('.big'), { variant: v.id, size: global.size, color: global.color, speed: global.speed, reducedMotion: reducedMotionOpt() });
  const mini = mount(card.querySelector('.mini-canvas'), { variant: v.id, size: 20, color: global.color, speed: global.speed, reducedMotion: reducedMotionOpt() });
  const stateEl = card.querySelector('.state');
  big.onState((s) => { stateEl.textContent = s; });
  stateEl.textContent = big.state;

  card.addEventListener('click', async (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    if (act === 'play') { big.play(); mini.play(); }
    else if (act === 'stop') { big.stop(); mini.stop(); }
    else if (act === 'bake') await bake(v);
    else if (act === 'archive') await toggleArchive(v.id);
    else if (act === 'cart') toggleCart(v.id);
    else if (act === 'copy') {
      const code = `import { mount } from './src/dots.js';\nimport './src/variants/index.js';\n\nconst loader = mount(document.querySelector('#loader'), { variant: '${v.id}', size: 20, color: '${global.color}' });\n// loader.stop();  // 이음새에서 퇴장 후 사라짐`;
      try { await navigator.clipboard.writeText(code); toast('복사했습니다'); } catch { toast('클립보드를 쓸 수 없습니다'); }
    }
  });
  cards.push({ v, big, mini, card });
  return card;
}

// ---- 보관 상태 ---------------------------------------------------------------
// 개발 서버(tools/serve.mjs)로 열면 /api 로 파일을 실제로 src/variants/archive/ 로 옮긴다.
// 그 밖(python 서버, 정적 호스팅)에서는 이 브라우저에만 기억한다(localStorage). 파일은 그대로.
const all = [...variants, ...archivedVariants];
const byId = new Map(all.map((v) => [v.id, v]));
const fileArchived = new Set(archivedVariants.map((v) => v.id));   // 실제로 archive 폴더에 있는 것
let localArchived = new Set();
try { localArchived = new Set(JSON.parse(localStorage.getItem('dot-loaders.archived') || '[]')); } catch {}
const saveLocal = () => { try { localStorage.setItem('dot-loaders.archived', JSON.stringify([...localArchived])); } catch {} };
let serverMode = false;
const isArchived = (id) => fileArchived.has(id) || (!serverMode && localArchived.has(id));

// ---- 카테고리별 묶음 + 보관함 ----------------------------------------------------
const groupsEl = $('#groups');
const groupEls = new Map();
for (const c of categories) {
  const sec = document.createElement('section');
  sec.className = 'group';
  sec.dataset.cat = c.id;
  sec.innerHTML = `<header><h2>${c.name}</h2><p>${c.description}</p></header><div class="grid"></div>`;
  groupsEl.appendChild(sec);
  groupEls.set(c.id, sec);
}
const archiveBox = $('#archiveBox'), archiveGrid = $('#archiveGrid');
const cardOf = new Map();
for (const c of categories) for (const v of all.filter((v) => v.category === c.id)) { makeCard(v); cardOf.set(v.id, cards[cards.length - 1]); }

function place(id) {
  const c = cardOf.get(id);
  const arch = isArchived(id);
  const btn = c.card.querySelector('.archive-btn');
  btn.textContent = arch ? '꺼내기' : '보관';
  btn.title = arch ? '보관함에서 꺼내 라이브러리로 되돌림' : '보관함으로 옮김 (라이브러리에서 뺌)';
  c.card.classList.toggle('archived', arch);
  if (arch) {
    archiveGrid.appendChild(c.card);
    // 보관함에서는 멈춘 한 장면만 (▶ 로 다시 볼 수 있음)
    c.big.seek('loop', c.v.loop.rest ?? 0); c.mini.seek('loop', c.v.loop.rest ?? 0);
    c.card.querySelector('.state').textContent = '보관됨';
  } else {
    // 카테고리 안의 원래 순서대로 끼워 넣기
    const grid = groupEls.get(c.v.category).querySelector('.grid');
    const order = all.filter((v) => v.category === c.v.category).map((v) => v.id);
    const after = [...grid.children].find((el) => order.indexOf(el.dataset.id) > order.indexOf(id));
    grid.insertBefore(c.card, after ?? null);
    c.big.play(); c.mini.play();
  }
}
for (const c of cards) c.card.dataset.id = c.v.id;

const activeOrdered = () => categories.flatMap((c) => all.filter((v) => v.category === c.id && !isArchived(v.id)));

function refreshCounts() {
  const active = activeOrdered();
  for (const b of chipsEl.querySelectorAll('button[data-cat]')) {
    const n = b.dataset.cat === 'all' ? active.length : active.filter((v) => v.category === b.dataset.cat).length;
    b.querySelector('.n').textContent = n;
    b.hidden = b.dataset.cat !== 'all' && n === 0;
  }
  const nArch = all.filter((v) => isArchived(v.id)).length;
  $('#archiveCount').textContent = nArch;
  archiveBox.classList.toggle('empty', nArch === 0);
  $('#archiveHint').innerHTML = serverMode
    ? '보관하면 파일이 실제로 <code>src/variants/archive/</code> 로 옮겨지고 라이브러리(<code>src/variants/index.js</code>)에서 빠집니다. 바뀐 파일은 git 으로 커밋하세요. 명령줄: <code>node tools/archive.mjs archive|restore &lt;id&gt;</code>'
    : '개발 서버(<code>npm run dev</code> 또는 <code>dev.bat</code>)로 연 페이지가 아니라서, 보관 상태는 <b>이 브라우저에만</b> 기억되고 파일은 그대로입니다. 실제로 옮기려면 개발 서버로 열거나 <code>node tools/archive.mjs archive &lt;id&gt;</code> 를 쓰세요.';
}

async function toggleArchive(id) {
  const to = isArchived(id) ? 'restore' : 'archive';
  if (serverMode) {
    try {
      const r = await fetch(`/api/${to}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await r.json();
      if (!r.ok) { toast(`실패: ${j.error}`); return; }
      if (to === 'archive') fileArchived.add(id); else fileArchived.delete(id);
      toast(to === 'archive' ? `${id} → ${j.file} 로 옮겼습니다` : `${id} 를 라이브러리로 꺼냈습니다`);
    } catch (e) { toast(`실패: ${e.message}`); return; }
  } else {
    if (to === 'restore' && fileArchived.has(id)) { toast('파일이 보관함 폴더에 있습니다. 개발 서버로 열어 꺼내세요'); return; }
    if (to === 'archive') localArchived.add(id); else localArchived.delete(id);
    saveLocal();
    toast(to === 'archive' ? `${id} 를 보관함으로 (이 브라우저에만)` : `${id} 를 꺼냈습니다`);
  }
  place(id);
  refreshCounts();
  selectCategory(currentCat, { shape: currentShape });
  syncCart();   // 보관하면 전달문의 파일 경로가 바뀐다
}

// ---- 이중 칩 필터: 윗줄 카테고리(움직임) → 아랫줄 배치(shape)로 카드를 거른다 ----
const chipsEl = $('#chips'), subChipsEl = $('#subChips');
let currentCat = 'all', currentShape = 'all';
const inCat = (v, cat) => cat === 'all' || v.category === cat;
const inShape = (v, sh) => sh === 'all' || v.shape === sh;

function selectCategory(id, { shape = 'all' } = {}) {
  const active = activeOrdered();
  if (id !== 'all' && !active.some((v) => v.category === id)) id = 'all';
  const pool = active.filter((v) => inCat(v, id));
  if (!pool.some((v) => inShape(v, shape))) shape = 'all';   // 새 카테고리에 없는 배치면 전체로
  currentCat = id; currentShape = shape;
  for (const b of chipsEl.querySelectorAll('button[data-cat]')) b.setAttribute('aria-pressed', String(b.dataset.cat === id));
  // 아랫줄: 이 카테고리 안의 배치별 개수 (0 인 배치는 숨김)
  subChipsEl.innerHTML = '';
  for (const sh of [{ id: 'all', name: '전체' }, ...shapes]) {
    const n = pool.filter((v) => inShape(v, sh.id)).length;
    if (!n) continue;
    const b = document.createElement('button');
    b.dataset.shape = sh.id;
    b.setAttribute('aria-pressed', String(sh.id === shape));
    b.innerHTML = `${sh.name}<span class="n">${n}</span>`;
    subChipsEl.appendChild(b);
  }
  const shown = pool.filter((v) => inShape(v, shape));
  const shownIds = new Set(shown.map((v) => v.id));
  for (const c of cards) if (!isArchived(c.v.id)) c.card.hidden = !shownIds.has(c.v.id);
  for (const [cid, sec] of groupEls) sec.hidden = !shown.some((v) => v.category === cid);
  try { localStorage.setItem('dot-loaders.cat', id); localStorage.setItem('dot-loaders.shape', shape); } catch {}
  for (const row of document.querySelectorAll('.chip-row')) syncMore(row);
  // 고른 하위 칩이 가려져 있으면 그 줄만 가로로 옮긴다 (페이지는 움직이지 않게)
  const on = subChipsEl.querySelector('[aria-pressed="true"]');
  if (on && (on.offsetLeft < subChipsEl.scrollLeft || on.offsetLeft + on.offsetWidth > subChipsEl.scrollLeft + subChipsEl.clientWidth)) subChipsEl.scrollLeft = on.offsetLeft - 16;
}
const chip = (id, label) => {
  const b = document.createElement('button');
  b.dataset.cat = id;
  b.innerHTML = `${label}<span class="n"></span>`;
  b.addEventListener('click', () => selectCategory(id, { shape: currentShape }));
  chipsEl.appendChild(b);
};
chip('all', '전체');
for (const c of categories) chip(c.id, c.name);
subChipsEl.addEventListener('click', (e) => {
  const sh = e.target.closest('button[data-shape]')?.dataset.shape;
  if (sh) selectCategory(currentCat, { shape: sh });
});
// 줄이 넘치면 오른쪽 › 로 넘겨 본다 (끝에 닿으면 숨김)
function syncMore(row) {
  const sc = row.querySelector('.chip-scroll');
  row.classList.toggle('more', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 2);
}
for (const row of document.querySelectorAll('.chip-row')) {
  const sc = row.querySelector('.chip-scroll');
  sc.addEventListener('scroll', () => syncMore(row), { passive: true });
  row.querySelector('.chip-more').addEventListener('click', () => sc.scrollBy({ left: sc.clientWidth * 0.7, behavior: 'smooth' }));
}
addEventListener('resize', () => { for (const row of document.querySelectorAll('.chip-row')) syncMore(row); });
for (const c of cards) place(c.v.id);
refreshCounts();
let savedCat = 'all', savedShape = 'all';
try { savedCat = localStorage.getItem('dot-loaders.cat') || 'all'; savedShape = localStorage.getItem('dot-loaders.shape') || 'all'; } catch {}
selectCategory(groupEls.has(savedCat) ? savedCat : 'all', { shape: savedShape });

// 개발 서버면 실제 파일 보관 모드로
fetch('/api/status', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => {
    if (!j?.archive) return;
    serverMode = true;
    for (const c of cards) place(c.v.id);   // 브라우저에만 보관했던 것은 다시 라이브러리로 보인다
    refreshCounts();
    selectCategory(currentCat, { shape: currentShape });
  })
  .catch(() => {});

// ---- 장바구니 ----------------------------------------------------------------
// 다른 프로젝트에서 "이거이거만 쓴다" 를 넘길 때: 카드의 담기 → 전달문/코드/링크 복사, 시트 한꺼번에 굽기.
const cartEl = $('#cart'), cartPanel = $('#cartPanel'), cartList = $('#cartList');
cart = cart.filter((id) => byId.has(id));
const fromHash = parseCartHash(location.hash, byId);
if (fromHash) cart = fromHash;
const cartItems = () => cart.map((id) => byId.get(id));
const cartOpts = () => ({ size: 20, color: global.color, ref: versionHash ?? 'main', isArchived: (id) => fileArchived.has(id) });
let cartCtl = null;

function toggleCart(id) {
  const had = cart.includes(id);
  cart = had ? cart.filter((x) => x !== id) : [...cart, id];
  toast(had ? `${id} 를 장바구니에서 뺐습니다` : `${id} 를 담았습니다 (${cart.length}개)`);
  syncCart();
}

function syncCart() {
  try { localStorage.setItem('dot-loaders.cart', JSON.stringify(cart)); } catch {}
  for (const c of cards) {
    const inCart = cart.includes(c.v.id);
    c.card.classList.toggle('in-cart', inCart);
    const b = c.card.querySelector('.cart-btn');
    b.textContent = inCart ? '담음 ✓' : '담기';
    b.title = inCart ? '장바구니에서 빼기' : '장바구니에 담기 (다른 프로젝트로 넘길 것만 고르기)';
  }
  $('#cartCount').textContent = cart.length;
  cartEl.classList.toggle('empty', cart.length === 0);
  cartList.innerHTML = cart.map((id) => `<li><code>${id}</code><span>${byId.get(id).name}</span><button data-remove="${id}" title="빼기">×</button></li>`).join('');
  $('#cartPreview').textContent = buildHandoff(cartItems(), cartOpts()) || '카드의 "담기" 를 눌러 다른 프로젝트에서 쓸 변형만 고르세요.';
  // 미리 보기 무대: 담은 것만 순환 (패널이 열려 있을 때만 돈다)
  if (!cartPanel.hidden && cart.length) {
    if (!cartCtl) cartCtl = mount($('#cartStage'), { variant: cart, size: 96, color: global.color, speed: global.speed, loops: 1, dwell: 2000, reducedMotion: reducedMotionOpt() });
    else cartCtl.set({ variant: cart });
    if (cartCtl.state === 'idle') cartCtl.play();
  } else cartCtl?.stop();
}

function openCart(open) {
  cartPanel.hidden = !open;
  $('#cartToggle').setAttribute('aria-expanded', String(open));
  syncCart();
}
$('#cartToggle').addEventListener('click', () => openCart(cartPanel.hidden));
$('#cartClose').addEventListener('click', () => openCart(false));
cartList.addEventListener('click', (e) => {
  const id = e.target.closest('button[data-remove]')?.dataset.remove;
  if (id) toggleCart(id);
});
async function copy(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); } catch { toast('클립보드를 쓸 수 없습니다'); }
}
cartPanel.addEventListener('click', async (e) => {
  const act = e.target.closest('button[data-cart]')?.dataset.cart;
  if (!act) return;
  if (act !== 'clear' && !cart.length) { toast('먼저 카드의 "담기" 로 변형을 고르세요'); return; }
  if (act === 'handoff') await copy(buildHandoff(cartItems(), cartOpts()), `전달문을 복사했습니다 (${cart.length}개)`);
  else if (act === 'code') await copy(buildCode(cartItems(), { ...cartOpts(), base: './dot-loaders' }), '코드를 복사했습니다');
  else if (act === 'link') await copy(new URL(cartHash(cart), location.href.split('#')[0]).href, '링크를 복사했습니다');
  else if (act === 'bake') { for (const v of cartItems()) await bake(v); }
  else if (act === 'clear') { cart = []; syncCart(); toast('장바구니를 비웠습니다'); }
});
syncCart();
if (fromHash?.length) openCart(true);

// ---- 모션 축소 무시 스위치 ---------------------------------------------------
const allCtls = () => [...(cartCtl ? [cartCtl] : []), ...cards.flatMap((c) => [c.big, c.mini])];
$('#motion').addEventListener('change', (e) => {
  ignoreReduce = e.target.checked;
  try { localStorage.setItem('dot-loaders.ignoreReduce', ignoreReduce ? '1' : '0'); } catch {}
  for (const c of allCtls()) c.set({ reducedMotion: reducedMotionOpt() });
  syncMotionUI();
});
reduceMql.addEventListener?.('change', syncMotionUI);
syncMotionUI();

// ---- 버전 표시 (GitHub Pages 배포 때 version.json 이 생성됨) ----------------
fetch('./version.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => {
    if (!j?.hash) return;
    versionHash = j.hash;
    syncCart();
    const el = $('#version');
    el.innerHTML = '';
    const a = document.createElement('a');
    a.textContent = `v${j.builtAt} · ${j.hash}`;
    if (j.repo) { a.href = `https://github.com/${j.repo}/commit/${j.hash}`; a.target = '_blank'; a.rel = 'noopener'; }
    el.appendChild(a);
  })
  .catch(() => {});
