// 뉴턴의 요람: 다섯 구슬이 실에 매달려 있고, 양 끝 구슬이 번갈아 튀어 오른다.
// 실은 반지름 0 인 축 점과 구슬을 잇는 선으로 그린다.


const N = 5, R = 0.07, GAP = 2 * R;
const PIVOT_Y = 0.14, L = 0.42;           // 축 높이, 실 길이
const A = 0.4;                             // 최대 진폭(라디안)
const PX = (i) => 0.5 + (i - (N - 1) / 2) * GAP;

function scene(angles, alpha = 1) {
  const dots = [], links = [];
  for (let i = 0; i < N; i++) {
    const th = angles[i];
    dots.push({ x: PX(i) + L * Math.sin(th), y: PIVOT_Y + L * Math.cos(th), r: R, alpha });
  }
  for (let i = 0; i < N; i++) {
    dots.push({ x: PX(i), y: PIVOT_Y, r: 0 });
    links.push({ a: i, b: N + i, alpha: 0.3 * alpha, width: 0.008 });
  }
  // 축을 잇는 가로대
  dots.push({ x: PX(0) - 0.05, y: PIVOT_Y, r: 0 }, { x: PX(N - 1) + 0.05, y: PIVOT_Y, r: 0 });
  links.push({ a: 2 * N, b: 2 * N + 1, alpha: 0.35 * alpha, width: 0.014 });
  return { dots, links };
}

function loop(t) {
  const angles = new Array(N).fill(0);
  if (t < 0.5) angles[0] = -A * Math.sin(2 * Math.PI * t);       // 왼쪽 구슬이 나갔다 돌아옴
  else angles[N - 1] = A * Math.sin(2 * Math.PI * (t - 0.5));    // 충돌 → 오른쪽 구슬
  return scene(angles);
}



export default {
  id: 'cradle',
  category: 'physics',
  shape: 'row',
  name: '뉴턴의 요람',
  description: '매달린 구슬 다섯. 양 끝이 번갈아 튀어 오르며 운동량을 넘긴다.',
  tags: ['물리', '선'],
  loop: { duration: 1400, seams: [0, 0.5], rest: 0, frame: loop },
};
