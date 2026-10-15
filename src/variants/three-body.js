// 삼체 8자: 같은 질량 세 개가 서로의 중력만으로 한 8자 곡선을 쫓아 도는 삼체 문제의 주기해
// (Moore 1993, Chenciner–Montgomery 2000). 초기값에서 뉴턴 운동방정식을 RK4 로 적분해 한 주기를 표로 만든다.
// 세 물체는 같은 곡선 위에서 주기의 1/3 씩 어긋나 있어서, 1/3 주기마다 장면이 (번호만 바뀐 채) 똑같아진다.
// 그래서 반복 한 바퀴 = 1/3 주기. 가운데를 지날 때 빨라지고 바깥 고리에서 느려지는 건 실제 속도다.

const T = 6.32591398;                       // 주기 (G = m = 1)
const STEPS = 3600;                          // 적분 걸음 (RK4)
const SAMPLES = 720;                         // 곡선 표 크기

function accel(p) {
  const a = [[0, 0], [0, 0], [0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    if (i === j) continue;
    const dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
    const r3 = Math.pow(dx * dx + dy * dy, 1.5);
    a[i][0] += dx / r3; a[i][1] += dy / r3;
  }
  return a;
}

// 상태 s = [p(3×2), v(3×2)] 를 dt 만큼 RK4 로
function rk4(p, v, dt) {
  const add = (x, k, h) => x.map((q, i) => [q[0] + h * k[i][0], q[1] + h * k[i][1]]);
  const k1v = accel(p), k1p = v;
  const k2v = accel(add(p, k1p, dt / 2)), k2p = add(v, k1v, dt / 2);
  const k3v = accel(add(p, k2p, dt / 2)), k3p = add(v, k2v, dt / 2);
  const k4v = accel(add(p, k3p, dt)), k4p = add(v, k3v, dt);
  const mix = (x, a, b, c, d) => x.map((q, i) => [
    q[0] + (dt / 6) * (a[i][0] + 2 * b[i][0] + 2 * c[i][0] + d[i][0]),
    q[1] + (dt / 6) * (a[i][1] + 2 * b[i][1] + 2 * c[i][1] + d[i][1]),
  ]);
  return [mix(p, k1p, k2p, k3p, k4p), mix(v, k1v, k2v, k3v, k4v)];
}

// 물체 0 의 한 주기 궤적 (나머지 둘은 같은 곡선을 시간만 어긋나게)
const CURVE = (() => {
  let p = [[0.97000436, -0.24308753], [-0.97000436, 0.24308753], [0, 0]];
  const v3 = [-0.93240737, -0.86473146];
  let v = [[-v3[0] / 2, -v3[1] / 2], [-v3[0] / 2, -v3[1] / 2], v3];
  const out = [];
  const every = STEPS / SAMPLES;
  for (let s = 0; s < STEPS; s++) {
    if (s % every === 0) out.push(p[0]);
    [p, v] = rk4(p, v, T / STEPS);
  }
  return out;
})();

const SCALE = 0.4 / 1.08;                   // 곡선 가로 폭 ±1.08 → ±0.4
function at(phase) {                        // phase: 0..1 (한 주기)
  const f = (((phase % 1) + 1) % 1) * SAMPLES;
  const i = Math.floor(f), k = f - i;
  const a = CURVE[i], b = CURVE[(i + 1) % SAMPLES];
  return [0.5 + SCALE * (a[0] + (b[0] - a[0]) * k), 0.5 - SCALE * (a[1] + (b[1] - a[1]) * k)];
}

const TRAIL = 7, GAP = 0.012;               // 꼬리: 지나온 자리에 옅은 작은 점
function loop(t) {
  const dots = [];
  for (let b = 0; b < 3; b++) {
    const phase = t / 3 + b / 3;
    for (let k = TRAIL; k >= 1; k--) {
      const [x, y] = at(phase - k * GAP);
      dots.push({ x, y, r: 0.026 * (1 - k / (TRAIL + 1)) + 0.006, alpha: 0.5 * (1 - k / (TRAIL + 1)) });
    }
    const [x, y] = at(phase);
    dots.push({ x, y, r: 0.068 });
  }
  return dots;
}

export default {
  id: 'three-body',
  category: 'science',
  shape: 'free',
  name: '삼체 8자',
  description: '세 질량이 서로의 중력만으로 8자 곡선 하나를 쫓아 돈다. 삼체 문제의 주기해를 RK4 로 적분.',
  tags: ['중력', 'ODE', '꼬리'],
  loop: {
    duration: 2600,
    seams: Array.from({ length: 12 }, (_, i) => i / 12),
    frame: loop,
  },
};
