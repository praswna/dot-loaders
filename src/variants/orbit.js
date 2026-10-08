// 궤도: 세 점이 3D 원 궤도 하나를 돈다 (FocusClip 노트 위젯의 옛 동기화 점, 7b30fa4 의 SpinFrame).
// 궤도면의 법선이 위(옆에서 본 수평 궤도)에서 시작해 천천히 기울고 돌아서, 좌우·대각·세로·정면(원)으로
// 보이는 움직임이 계속 바뀐다. 앞쪽 점은 크고 진하고 위에, 뒤쪽은 작고 옅다.
//
// 원본은 끝없이 흐르는 시간 t(초)로 돌았다: 회전 5, 기울기 0.85, 기우는 방향 0.65 (rad/s).
// 반복 시트로 구울 수 있게 한 바퀴(LOOP 초) 안에 셋 다 정수 번 돌도록 속도를 살짝 맞췄다:
// 기울기 4번(0.858), 방향 3번(0.643), 점은 23바퀴(4.93).

const LOOP = 29.3;                     // 초
const SPIN = (23 * 2 * Math.PI) / LOOP;
const TILT = (4 * 2 * Math.PI) / LOOP;
const TURN = (3 * 2 * Math.PI) / LOOP;
const R = 0.3;                         // 궤도 반지름 (원본 7px / 22px 캔버스 비율)
const DOT = 0.107;                     // 앞쪽 점 반지름 (원본 지름 5px)

function loop(u) {
  const t = u * LOOP;
  const a = 1.3 * Math.sin(t * TILT);  // 기울기
  const b = t * TURN;                  // 기우는 방향
  const n0 = Math.sin(a) * Math.cos(b), n1 = Math.cos(a), n2 = Math.sin(a) * Math.sin(b);
  // 궤도면을 이루는 두 축: u = n × z (정규화), v = n × u
  const ul = Math.hypot(n1, n0) || 1;
  const u0 = n1 / ul, u1 = -n0 / ul, u2 = 0;
  const v0 = -n2 * u1, v1 = n2 * u0, v2 = n0 * u1 - n1 * u0;
  const dots = [];
  for (let k = 0; k < 3; k++) {
    const f = t * SPIN + (k * 2 * Math.PI) / 3;
    const c = Math.cos(f), s = Math.sin(f);
    const depth = (c * u2 + s * v2 + 1) / 2; // 0 뒤 .. 1 앞
    dots.push({
      x: 0.5 + R * (c * u0 + s * v0),
      y: 0.5 + R * (c * u1 + s * v1),
      r: DOT * (0.5 + 0.5 * depth),
      alpha: 0.35 + 0.65 * depth,
      depth,
    });
  }
  dots.sort((p, q) => p.depth - q.depth); // 앞의 점이 위에 그려지게
  return dots;
}

export default {
  id: 'orbit',
  name: '궤도',
  description: '세 점이 3D 원 궤도를 돈다. 궤도면이 천천히 기울고 돌아 모양이 계속 바뀐다.',
  tags: ['원형', '3D'],
  loop: {
    duration: LOOP * 1000,
    seams: Array.from({ length: 48 }, (_, i) => i / 48), // 어디서 멈춰도 바로 모이게
    rest: 1 / 16,                                         // 가장 기울어진 때
    frame: loop,
  },
};
