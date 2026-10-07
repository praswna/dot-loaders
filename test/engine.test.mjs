// 브라우저 없이 엔진의 상태 전이를 검사한다: enter → loop → (stop) → seam 에서 exit → idle.
// 실행: node test/engine.test.mjs   (또는 npm test)
import assert from 'node:assert/strict';

// ---- 최소한의 브라우저 흉내 -------------------------------------------------
const noop = () => {};
class FakeCtx {
  constructor() { this.calls = 0; }
  setTransform() {} clearRect() {} save() {} restore() {} translate() {} fillRect() {}
  beginPath() {} moveTo() {} lineTo() {} stroke() {} arc() { this.calls++; } fill() {}
}
class HTMLCanvasElement {
  constructor() { this.style = {}; this.ctx = new FakeCtx(); }
  getContext() { return this.ctx; }
  setAttribute() {}
  remove() {}
}
globalThis.HTMLCanvasElement = HTMLCanvasElement;
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(performance.now()), 16);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

const { mount, list, sample, bakeSpriteSheet, POINT } = await import('../src/dots.js');
await import('../src/variants/index.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- 1. 모든 변형의 모든 장면이 유한한 좌표를 돌려주는가 ----------------------
for (const v of list()) {
  for (const phase of ['enter', 'loop', 'exit']) {
    if (!v[phase]) continue;
    for (let i = 0; i <= 50; i++) {
      const f = sample(v, phase, i / 50);
      assert.ok(f.dots.length > 0, `${v.id}.${phase}: 점이 없음`);
      for (const d of f.dots) {
        assert.ok(Number.isFinite(d.x) && Number.isFinite(d.y) && Number.isFinite(d.r), `${v.id}.${phase} t=${i / 50}: 좌표가 유한하지 않음`);
      }
    }
  }
  assert.ok(v.loop.duration > 0, `${v.id}: loop.duration`);
}
console.log(`ok  변형 ${list().length}개 장면 샘플링`);

// ---- 2. 상태 전이 ----------------------------------------------------------
{
  const canvas = new HTMLCanvasElement();
  const seen = [];
  const ctl = mount(canvas, { variant: 'claude-code', size: 20, speed: 4 }); // 4배속: loop 625ms, seam 마다 156ms
  ctl.onState((s) => seen.push([s, performance.now()]));
  assert.equal(ctl.state, 'enter', '시작은 enter');
  await sleep(533 / 4 + 80);
  assert.equal(ctl.state, 'loop', 'enter 뒤 loop');
  const stopAt = performance.now();
  ctl.stop();
  await sleep(600);
  const exitAt = seen.find(([s]) => s === 'exit')?.[1];
  assert.ok(exitAt, 'stop 뒤 exit 로 넘어가야 함');
  assert.ok(exitAt - stopAt <= 156 + 40, `seam 안에서 exit 로 넘어가야 함 (걸린 시간 ${Math.round(exitAt - stopAt)}ms)`);
  assert.equal(ctl.state, 'idle', 'exit 뒤 idle');
  assert.ok(canvas.ctx.calls > 0, '점을 그렸어야 함');
  ctl.destroy();
  console.log('ok  enter → loop → stop → exit(seam) → idle');
}

// ---- 3. 한 점 규칙: 모든 변형은 가운데 한 점에서 퍼져 나오고 한 점으로 모인다 ---------
{
  const onePoint = (f, label) => {
    const visible = f.dots.filter((d) => d.r > 0 && (d.alpha ?? 1) > 0);
    assert.ok(visible.length > 0, `${label}: 보이는 점이 없음`);
    for (const d of visible) {
      assert.ok(Math.abs(d.x - POINT.x) < 1e-6 && Math.abs(d.y - POINT.y) < 1e-6, `${label}: 점이 가운데에 있지 않음 (${d.x}, ${d.y})`);
      assert.ok(Math.abs(d.r - POINT.r) < 1e-3, `${label}: 한 점 반지름이 ${POINT.r} 가 아님 (${d.r})`);
    }
  };
  for (const v of list()) {
    assert.ok(v.enter && v.exit, `${v.id}: enter/exit 가 있어야 함`);
    onePoint(sample(v, 'enter', 0), `${v.id}.enter t=0`);
    for (const seam of v.loop.seams ?? [0]) onePoint(sample(v, 'exit', 1, seam), `${v.id}.exit t=1 seam=${seam}`);
    // 공통 exit 는 이음새 장면에서 이어진다
    if (v.exit.generic) {
      const seam = (v.loop.seams ?? [0])[0];
      const a = sample(v, 'loop', seam).dots, b = sample(v, 'exit', 0, seam).dots;
      assert.equal(a.length, b.length, `${v.id}: exit t=0 은 loop 이음새 장면과 같아야 함`);
      for (let i = 0; i < a.length; i++) assert.ok(Math.abs(a[i].x - b[i].x) < 1e-9 && Math.abs(a[i].y - b[i].y) < 1e-9, `${v.id}: exit 시작 장면이 이음새와 다름`);
    }
  }
  console.log(`ok  한 점 규칙 (${list().length}개 변형의 enter 시작·exit 끝이 가운데 한 점)`);
}

// ---- 4. 순환: 한 점 → A → 한 점 → B → 한 점 → A … ------------------------------
{
  const canvas = new HTMLCanvasElement();
  const seen = [];
  const ctl = mount(canvas, { variant: ['ring', 'typing'], size: 20, speed: 8, loops: 1 }); // ring loop 125ms, typing 137ms
  ctl.onState((s) => seen.push(`${ctl.variant.id}:${s}`));
  assert.deepEqual(ctl.cycle, ['ring', 'typing']);
  await sleep(900);
  const idx = (k) => seen.indexOf(k);
  assert.ok(idx('ring:exit') > -1 && idx('typing:enter') > idx('ring:exit'), `ring 이 한 점으로 모인 뒤 typing 이 퍼져야 함: ${seen.join(' ')}`);
  assert.ok(idx('typing:exit') > idx('typing:enter') && seen.lastIndexOf('ring:enter') > idx('typing:exit'), `typing 뒤 다시 ring 으로 돌아와야 함: ${seen.join(' ')}`);
  assert.ok(!seen.includes('ring:idle') && !seen.includes('typing:idle'), '순환 중에는 idle 이 되지 않음');
  ctl.stop();
  await sleep(400);
  assert.equal(ctl.state, 'idle', 'stop 은 순환을 끝내고 idle');
  // next(id): 돌고 있는 동안 다른 변형으로 한 점을 거쳐 넘어간다
  ctl.play();
  ctl.next('dice');
  await sleep(500);
  assert.equal(ctl.variant.id, 'dice', `next('dice') 뒤에는 dice 여야 함`);
  assert.ok(ctl.state === 'enter' || ctl.state === 'loop');
  ctl.destroy();
  console.log('ok  순환 (ring → 한 점 → typing → 한 점 → ring), next()');
}

// ---- 4b. 모션 축소에서도 순환은 변형을 바꾼다 (정지 화면끼리) -----------------------
{
  const canvas = new HTMLCanvasElement();
  const ctl = mount(canvas, { variant: ['ring', 'typing'], size: 20, speed: 8, loops: 1, reducedMotion: true });
  const seen = new Set([ctl.variant.id]);
  ctl.onState(() => seen.add(ctl.variant.id));
  await sleep(600);
  assert.deepEqual([...seen].sort(), ['ring', 'typing'], `모션 축소에서도 두 변형을 오가야 함 (${[...seen]})`);
  assert.equal(ctl.state, 'loop');
  ctl.destroy();
  console.log('ok  모션 축소에서도 순환');
}

// ---- 4. 시트 굽기 매니페스트 (캔버스 없이 계산되는 부분만) ----------------------
{
  globalThis.document = { createElement: () => new HTMLCanvasElement() };
  const { manifest } = bakeSpriteSheet('claude-code', { phase: 'loop', frame: 48, fps: 30 });
  assert.equal(manifest.frames, 75, 'claude-code loop 는 75프레임이어야 함 (2500ms / 33.33ms)');
  assert.deepEqual(manifest.seams, [0, 19, 38, 56]);
  console.log('ok  스프라이트 시트 매니페스트', JSON.stringify(manifest));
}

console.log('모두 통과');
