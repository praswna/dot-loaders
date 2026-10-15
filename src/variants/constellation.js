// 별자리: 다섯 점이 리사주 곡선을 따라 떠다니고, 가까워진 점끼리 선이 생겼다 사라진다.
// 주파수가 정수라 한 바퀴(8초)가 정확히 이어진다.

const STARS = [
  [1, 2, 0.00, 0.25],
  [2, 1, 0.50, 0.00],
  [1, 1, 0.33, 0.66],
  [2, 3, 0.10, 0.40],
  [3, 2, 0.70, 0.20],
];
const REACH = 0.42;

function loop(t) {
  const dots = STARS.map(([fa, fb, pa, pb]) => ({
    x: 0.5 + 0.32 * Math.sin(2 * Math.PI * (fa * t + pa)),
    y: 0.5 + 0.32 * Math.sin(2 * Math.PI * (fb * t + pb)),
    r: 0.05,
  }));
  const links = [];
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
      if (d < REACH) links.push({ a: i, b: j, alpha: (1 - d / REACH) * 0.5, width: 0.012 });
    }
  }
  return { dots, links };
}

export default {
  id: 'constellation',
  category: 'drift',
  shape: 'free',
  name: '별자리',
  description: '점들이 떠다니다 가까워지면 선으로 이어진다. 느긋하고 사색적인 대기 표시.',
  tags: ['자유', '선'],
  loop: { duration: 8000, seams: [0], frame: loop },
};
