// 갤러리 페이지. 엔진과 변형을 불러와 카드로 늘어놓는다.
import { mount, bakeSpriteSheet, toPngBlob } from './src/dots.js';
import { variants } from './src/variants/index.js';

const $ = (sel) => document.querySelector(sel);
const grid = $('#grid');
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
$('#theme').addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

// ---- 모션 축소 ------------------------------------------------------------
// OS 설정이 켜져 있으면 엔진은 정지 화면만 그린다. 갤러리에서는 알려 주고, 원하면 이 페이지에서만 무시한다.
const reduceMql = matchMedia('(prefers-reduced-motion: reduce)');
let ignoreReduce = false;
try { ignoreReduce = localStorage.getItem('dot-loaders.ignoreReduce') === '1'; } catch {}
const reducedMotionOpt = () => (ignoreReduce ? false : 'auto');
function syncMotionUI() {
  const on = reduceMql.matches;
  $('#motionWrap').hidden = !on;
  $('#motionNotice').hidden = !on || ignoreReduce;
  $('#motion').checked = ignoreReduce;
}

// ---- 카드 ----------------------------------------------------------------
const global = { size: Number($('#size').value), speed: 1, color: $('#color').value };
const cards = [];

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
  const frame = Number($('#bakeFrame').value) || 48;
  const fps = Number($('#bakeFps').value) || 30;
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
    else if (act === 'copy') {
      const code = `import { mount } from './src/dots.js';\nimport './src/variants/index.js';\n\nconst loader = mount(document.querySelector('#loader'), { variant: '${v.id}', size: 20, color: '${global.color}' });\n// loader.stop();  // 이음새에서 퇴장 후 사라짐`;
      try { await navigator.clipboard.writeText(code); toast('복사했습니다'); } catch { toast('클립보드를 쓸 수 없습니다'); }
    }
  });
  cards.push({ v, big, mini });
  return card;
}

for (const v of variants) grid.appendChild(makeCard(v));

// ---- 순환 재생: 한 점 → 변형 → 한 점 → 다음 변형 … -------------------------------
const cycleCtl = mount($('#cycleStage'), {
  variant: variants.map((v) => v.id), size: 160, color: global.color, speed: global.speed, loops: 1, dwell: 3000,
  reducedMotion: reducedMotionOpt(),
});
const cycleName = $('#cycleName'), cycleState = $('#cycleState');
const showCycle = (s) => { cycleName.textContent = cycleCtl.variant.id; cycleState.textContent = s; };
cycleCtl.onState(showCycle);
showCycle(cycleCtl.state);
$('#cyclePlay').addEventListener('click', () => cycleCtl.play());
$('#cycleStop').addEventListener('click', () => cycleCtl.stop());
$('#cycleNext').addEventListener('click', () => cycleCtl.next());

// ---- 전역 컨트롤 ---------------------------------------------------------
$('#size').addEventListener('change', (e) => {
  global.size = Number(e.target.value);
  for (const c of cards) c.big.set({ size: global.size });
});
$('#speed').addEventListener('input', (e) => {
  global.speed = Number(e.target.value);
  $('#speedVal').textContent = `${global.speed.toFixed(2)}×`;
  for (const c of cards) { c.big.set({ speed: global.speed }); c.mini.set({ speed: global.speed }); }
  cycleCtl.set({ speed: global.speed });
});
$('#color').addEventListener('input', (e) => {
  global.color = e.target.value;
  for (const c of cards) { c.big.set({ color: global.color }); c.mini.set({ color: global.color }); }
  cycleCtl.set({ color: global.color });
});
const allCtls = () => [cycleCtl, ...cards.flatMap((c) => [c.big, c.mini])];
$('#motion').addEventListener('change', (e) => {
  ignoreReduce = e.target.checked;
  try { localStorage.setItem('dot-loaders.ignoreReduce', ignoreReduce ? '1' : '0'); } catch {}
  for (const c of allCtls()) c.set({ reducedMotion: reducedMotionOpt() });
  syncMotionUI();
});
reduceMql.addEventListener?.('change', syncMotionUI);
syncMotionUI();
$('#playAll').addEventListener('click', () => { for (const c of cards) { c.big.play(); c.mini.play(); } });
$('#stopAll').addEventListener('click', () => { for (const c of cards) { c.big.stop(); c.mini.stop(); } });

// ---- 버전 표시 (GitHub Pages 배포 때 version.json 이 생성됨) ----------------
fetch('./version.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then((j) => {
    if (!j?.hash) return;
    const el = $('#version');
    el.innerHTML = '';
    const a = document.createElement('a');
    a.textContent = `v${j.builtAt} · ${j.hash}`;
    if (j.repo) { a.href = `https://github.com/${j.repo}/commit/${j.hash}`; a.target = '_blank'; a.rel = 'noopener'; }
    el.appendChild(a);
  })
  .catch(() => {});
