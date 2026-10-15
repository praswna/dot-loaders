// 푸리에 원: 하트 곡선을 이산 푸리에 변환(DFT)으로 분해하고, 그 계수대로 크기·속도가 다른 원(주전원)을
// 줄줄이 이어 돌린다. 마지막 원의 끝이 하트를 그린다.
// 하트 x = 16 sin³s, y = 13 cos s − 5 cos 2s − 2 cos 3s − cos 4s 는 유한 푸리에 급수라 원 몇 개면 정확히 그려진다.
// 마디는 작은 점, 팔은 선, 끝점은 큰 점에 꼬리.

const M = 128;                               // DFT 표본 수
const heart = (s) => [16 * Math.sin(s) ** 3, 13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)];

// z(s) = Σ c_k e^{iks}, k = -M/2..M/2-1. 크기 순으로 정렬하고 작은 것은 버린다.
const TERMS = (() => {
  const pts = Array.from({ length: M }, (_, n) => heart((2 * Math.PI * n) / M));
  const out = [];
  for (let k = -M / 2; k < M / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < M; n++) {
      const a = (-2 * Math.PI * k * n) / M, [x, y] = pts[n];
      re += x * Math.cos(a) - y * Math.sin(a);
      im += x * Math.sin(a) + y * Math.cos(a);
    }
    re /= M; im /= M;
    const amp = Math.hypot(re, im);
    if (k !== 0 && amp > 1e-6) out.push({ k, re, im, amp });   // k=0(평균)은 중심이라 chain 이 따로 넣는다
  }
  return out.sort((a, b) => b.amp - a.amp);
})();

const SCALE = 0.36 / 17, CY = 0.03;          // 하트 폭 ±16 → ±0.34, 살짝 아래로
const toScreen = (x, y) => [0.5 + SCALE * x, 0.5 + CY - SCALE * y];

function chain(s) {                           // 각 원의 중심(마디)들, 마지막이 끝점
  let x = 0, y = 0;
  const joints = [toScreen(0, 0)];           // 첫 원의 중심 (하트의 평균, k=0 항)
  for (const { k, re, im } of TERMS) {
    const c = Math.cos(k * s), sn = Math.sin(k * s);
    x += re * c - im * sn; y += re * sn + im * c;
    joints.push(toScreen(x, y));
  }
  return joints;
}

const TRAIL = 22, STEP = 0.018;
const OUTLINE = Array.from({ length: 48 }, (_, i) => toScreen(...heart((2 * Math.PI * i) / 48)));   // 그려질 하트 (옅게)
function loop(t) {
  const s = 2 * Math.PI * t;
  const joints = chain(s);
  const dots = OUTLINE.map(([x, y]) => ({ x, y, r: 0.007, alpha: 0.22 }));
  const links = [];
  for (let k = TRAIL; k >= 1; k--) {
    const tip = chain(s - k * STEP * 2 * Math.PI).at(-1);
    dots.push({ x: tip[0], y: tip[1], r: 0.008 + 0.02 * (1 - k / (TRAIL + 1)), alpha: 0.7 * (1 - k / (TRAIL + 1)) });
  }
  const base = dots.length;
  joints.forEach(([x, y], i) => {
    const last = i === joints.length - 1;
    dots.push({ x, y, r: last ? 0.062 : i === 0 ? 0.032 : 0.022, alpha: last ? 1 : 0.75 });
    if (i > 0) links.push({ a: base + i - 1, b: base + i, width: 0.014, alpha: 0.6 });
  });
  return { dots, links };
}

export default {
  id: 'fourier',
  category: 'science',
  shape: 'free',
  name: '푸리에 원',
  description: '하트 곡선을 푸리에 변환한 계수대로 원들이 이어 돌고, 끝점이 하트를 그린다.',
  tags: ['DFT', '주전원', '선'],
  loop: {
    duration: 4200,
    seams: Array.from({ length: 8 }, (_, i) => i / 8),
    frame: loop,
  },
};
