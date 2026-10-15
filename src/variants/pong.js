// 퐁: 공이 좌우 채와 위아래 벽 사이를 튀고, 채는 한 박자 늦게 공을 따라간다. 가운데 점선 네트.

const LX = 0.12, RX = 0.88, TOP = 0.14, BOT = 0.86;
const PADDLE = 3, PAD_GAP = 0.1, LAG = 0.045;

const tri = (u) => { u = ((u % 1) + 1) % 1; return u < 0.5 ? u * 2 : 2 - u * 2; }; // 0→1→0
const ballX = (t) => LX + (RX - LX) * tri(t);        // 한 바퀴에 좌→우→좌
const ballY = (t) => TOP + (BOT - TOP) * tri(t * 2 + 0.25); // 위아래는 두 번 왕복, 모서리 동시 충돌 피하려 위상 차

function loop(t) {
  const dots = [];
  dots.push({ x: ballX(t), y: ballY(t), r: 0.05, alpha: 1 });
  // 채: 공이 자기 쪽으로 올 때 더 열심히 따라온다
  const paddle = (x, follow) => {
    const cy = Math.min(BOT - PAD_GAP, Math.max(TOP + PAD_GAP, ballY(t - LAG)));
    const y = cy * follow + 0.5 * (1 - follow);
    for (let i = 0; i < PADDLE; i++) dots.push({ x, y: y + (i - 1) * PAD_GAP, r: 0.04, alpha: 0.85 });
  };
  const toward = tri(t); // 0 왼쪽, 1 오른쪽
  paddle(LX, 1 - 0.5 * toward);
  paddle(RX, 0.5 + 0.5 * toward);
  for (let i = 0; i < 6; i++) dots.push({ x: 0.5, y: 0.17 + i * 0.132, r: 0.012, alpha: 0.3 });
  return dots;
}

export default {
  id: 'pong',
  category: 'physics',
  shape: 'free',
  name: '퐁',
  description: '공이 채와 벽 사이를 튀고, 채가 공을 따라간다.',
  tags: ['게임', '물리'],
  loop: { duration: 2400, seams: [0, 0.5], rest: 0, frame: loop },
};
