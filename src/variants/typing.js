// 입력 중: 채팅 앱의 "상대가 입력 중" 표시. 세 점이 차례로 통통 튀고, 바닥에 있을 때는 옅어진다.


const N = 3, R = 0.085, Y = 0.56, HOP = 0.17;
const X = (i) => 0.22 + 0.28 * i;

function loop(t) {
  const dots = [];
  for (let i = 0; i < N; i++) {
    const u = (((t - i * 0.14) % 1) + 1) % 1;       // 점마다 위상 차
    const h = u < 0.42 ? Math.sin((Math.PI * u) / 0.42) : 0; // 0..1 포물선 같은 도약
    dots.push({ x: X(i), y: Y - HOP * h, r: R * (1 + 0.1 * h), alpha: 0.4 + 0.6 * h });
  }
  return dots;
}



export default {
  id: 'typing',
  category: 'wave',
  shape: 'row',
  name: '입력 중',
  description: '채팅 "입력 중" 표시. 세 점이 차례로 튀어 오른다.',
  tags: ['가로', '고전'],
  loop: { duration: 1100, seams: [0], rest: 0, frame: loop },
};
