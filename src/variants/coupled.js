// 결합 진자: 용수철로 이은 진자 둘. 고유 진동(같이 흔들림 ω₁, 반대로 흔들림 ω₂)의 합으로 풀면
//   θ₁ = A cos(ω̄t) cos(Δt),  θ₂ = A sin(ω̄t) sin(Δt),   ω̄ = (ω₁+ω₂)/2, Δ = (ω₂−ω₁)/2
// 왼쪽만 흔들다가 에너지가 용수철을 타고 오른쪽으로 넘어가고, 다시 돌아온다(맥놀이).
// ω₁ : ω₂ = 10 : 12 로 잡아 한 바퀴에 맥놀이 한 번, 흔들림 11번이 정확히 들어간다.

const W1 = 10, W2 = 12, A = 0.5;             // 한 바퀴당 진동 수, 최대 각(rad)
const BAR = 0.2, LEN = 0.52, GAP = 0.34, SPRING = 0.5, COILS = 5;

function loop(t) {
  const wb = (2 * Math.PI * (W1 + W2)) / 2, dw = (2 * Math.PI * (W2 - W1)) / 2;
  const th = [A * Math.cos(wb * t) * Math.cos(dw * t), A * Math.sin(wb * t) * Math.sin(dw * t)];
  const pivots = [[0.5 - GAP / 2, BAR], [0.5 + GAP / 2, BAR]];
  const at = (i, f) => [pivots[i][0] + f * LEN * Math.sin(th[i]), pivots[i][1] + f * LEN * Math.cos(th[i])];
  const dots = [], links = [];
  // 매단 막대 (장식)
  for (let k = 0; k <= 6; k++) dots.push({ x: 0.5 - GAP / 2 - 0.06 + ((GAP + 0.12) * k) / 6, y: BAR, r: 0.009, alpha: 0.35 });
  for (let i = 0; i < 2; i++) {
    const p = dots.length;
    dots.push({ x: pivots[i][0], y: pivots[i][1], r: 0.014, alpha: 0.6 });
    const [bx, by] = at(i, 1);
    dots.push({ x: bx, y: by, r: 0.062, alpha: 1 - 0.25 * i });
    links.push({ a: p, b: p + 1, width: 0.013, alpha: 0.5 });
  }
  // 용수철: 두 막대의 SPRING 지점 사이를 지그재그 점으로
  const [ax, ay] = at(0, SPRING), [cx, cy] = at(1, SPRING);
  const nx = -(cy - ay), ny = cx - ax, nl = Math.hypot(nx, ny) || 1;
  const first = dots.length;
  for (let k = 0; k <= COILS * 2; k++) {
    const f = k / (COILS * 2), off = k === 0 || k === COILS * 2 ? 0 : (k % 2 ? 1 : -1) * 0.022;
    dots.push({ x: ax + (cx - ax) * f + (nx / nl) * off, y: ay + (cy - ay) * f + (ny / nl) * off, r: 0.008, alpha: 0.6 });
    if (k) links.push({ a: first + k - 1, b: first + k, width: 0.008, alpha: 0.45 });
  }
  return { dots, links };
}

export default {
  id: 'coupled',
  category: 'science',
  shape: 'row',
  name: '결합 진자',
  description: '용수철로 이은 진자 둘. 두 고유 진동이 겹쳐 흔들림이 한쪽에서 다른 쪽으로 넘어갔다 돌아온다(맥놀이).',
  tags: ['진동', '맥놀이', '선'],
  loop: { duration: 6000, seams: [0, 0.5], rest: 0.25, frame: loop },
};
