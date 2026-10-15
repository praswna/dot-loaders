// 숨쉬기: 3×3 점이 가운데에서 바깥으로 퍼지는 파도처럼 커졌다 작아진다.

const G = [0.22, 0.5, 0.78];
const CELLS = [];
for (const y of G) for (const x of G) {
  CELLS.push({ x, y, d: Math.hypot(x - 0.5, y - 0.5) / Math.hypot(0.28, 0.28) }); // 0(중심)..1(모서리)
}

function loop(t) {
  return CELLS.map(({ x, y, d }) => {
    const w = Math.sin(2 * Math.PI * (t - 0.22 * d));
    return { x, y, r: 0.028 + 0.05 * (0.5 + 0.5 * w), alpha: 0.55 + 0.45 * (0.5 + 0.5 * w) };
  });
}

export default {
  id: 'breathe',
  category: 'wave',
  shape: '3x3',
  name: '숨쉬기',
  description: '3×3 격자가 가운데서 바깥으로 파도치듯 부풀었다 가라앉는다.',
  tags: ['3x3', '맥동'],
  loop: { duration: 1800, seams: [0], frame: loop },
};
