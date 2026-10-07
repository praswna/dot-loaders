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

const { mount, list, sample, bakeSpriteSheet } = await import('../src/dots.js');
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

// ---- 3. exit 가 없는 변형은 stop 즉시 idle ------------------------------------
{
  const canvas = new HTMLCanvasElement();
  const ctl = mount(canvas, { variant: 'sine-wave', size: 20 });
  assert.equal(ctl.state, 'loop', 'enter 가 없으면 바로 loop');
  ctl.stop();
  assert.equal(ctl.state, 'idle', 'exit 가 없으면 바로 idle');
  ctl.destroy();
  console.log('ok  exit 없는 변형은 바로 idle');
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
