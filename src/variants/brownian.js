// 브라운 고리: 제멋대로 떠도는 것 같지만 정확히 반복하는 닫힌 브라운 경로.
// 브라운 운동은 진동수 k 성분의 크기가 1/k 에 비례하는 푸리에 급수로 쓸 수 있다(카르후넨–뢰브 전개).
//   X(t) = Σ_{k=1..K} (aₖ cos 2πkt + bₖ sin 2πkt) / k,   aₖ, bₖ ~ 정규분포 (고정된 씨앗)
// 정수 진동수만 쓰니 t=1 에서 정확히 처음으로 돌아온다. 입자 셋이 지나온 자취를 꼬리로 남긴다.

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TERMS = 40;
const PATHS = [11, 23, 37].map((seed) => {
  const r = rng(seed), gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  return Array.from({ length: TERMS }, (_, i) => ({ k: i + 1, ax: gauss(), bx: gauss(), ay: gauss(), by: gauss() }));
});
const raw = (path, t) => {
  let x = 0, y = 0;
  for (const { k, ax, bx, ay, by } of path) {
    const c = Math.cos(2 * Math.PI * k * t), s = Math.sin(2 * Math.PI * k * t);
    x += (ax * c + bx * s) / k; y += (ay * c + by * s) / k;
  }
  return [x, y];
};
const FIT = PATHS.map((p) => {                 // 경로마다 화면 안에 들도록 (가운데 정렬)
  let lx = Infinity, hx = -Infinity, ly = Infinity, hy = -Infinity;
  for (let i = 0; i < 400; i++) { const [x, y] = raw(p, i / 400); lx = Math.min(lx, x); hx = Math.max(hx, x); ly = Math.min(ly, y); hy = Math.max(hy, y); }
  const s = 0.76 / Math.max(hx - lx, hy - ly);
  return { s, cx: (lx + hx) / 2, cy: (ly + hy) / 2 };
});

const TRAIL = 22, STEP = 0.004;
function loop(t) {
  const dots = [];
  PATHS.forEach((p, i) => {
    const { s, cx, cy } = FIT[i];
    const at = (u) => { const [x, y] = raw(p, u); return [0.5 + s * (x - cx), 0.5 + s * (y - cy)]; };
    for (let k = TRAIL; k >= 1; k--) {
      const [x, y] = at(t - k * STEP);
      dots.push({ x, y, r: 0.006 + 0.014 * (1 - k / (TRAIL + 1)), alpha: 0.45 * (1 - k / (TRAIL + 1)) });
    }
    const [x, y] = at(t);
    dots.push({ x, y, r: 0.046, alpha: 1 - 0.2 * i });
  });
  return dots;
}

export default {
  id: 'brownian',
  category: 'science',
  shape: 'free',
  name: '브라운 고리',
  description: '제멋대로 떠도는 듯하지만 1/k 푸리에 급수로 만든 닫힌 브라운 경로라 정확히 반복한다.',
  tags: ['확률', '푸리에', '꼬리'],
  loop: { duration: 9000, seams: Array.from({ length: 12 }, (_, i) => i / 12), frame: loop },
};
