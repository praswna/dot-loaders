// 간섭무늬: 5×5 점 바다에 두 파원에서 나온 물결이 겹친다. 마루에서 점이 커지고 골에서 작아진다.

const N = 5, CELL = 0.19, OFF = 0.12;
const SOURCES = [[0.05, 0.5], [0.95, 0.5]];
const K = 2 * Math.PI / 0.5; // 파장 0.5

function loop(t) {
  const dots = [];
  const phase = 2 * Math.PI * t;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const px = OFF + x * CELL, py = OFF + y * CELL;
    let h = 0;
    for (const [sx, sy] of SOURCES) h += Math.sin(K * Math.hypot(px - sx, py - sy) - phase);
    h /= SOURCES.length; // -1..1
    dots.push({ x: px, y: py, r: 0.04 + 0.035 * h, alpha: 0.4 + 0.6 * (h + 1) / 2 });
  }
  return dots;
}

export default {
  id: 'interference',
  name: '간섭무늬',
  description: '두 파원의 물결이 5×5 점 위에서 겹친다.',
  tags: ['5x5', '격자', '물결'],
  loop: { duration: 2000, seams: [0], rest: 0, frame: loop },
};
