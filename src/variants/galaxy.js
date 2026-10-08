// 은하: 로그 나선 팔 셋이 돈다. 안쪽 별은 두 바퀴, 바깥 별은 한 바퀴 돌아 차등 회전처럼 팔이 감겼다 풀린다.

const ARMS = 3, PER_ARM = 5, B = 0.4;

function loop(t) {
  const dots = [{ x: 0.5, y: 0.5, r: 0.06, alpha: 1 }];
  for (let a = 0; a < ARMS; a++) {
    for (let i = 0; i < PER_ARM; i++) {
      const f = i / (PER_ARM - 1);                 // 0 안쪽 .. 1 바깥
      const theta0 = (2 * Math.PI * a) / ARMS + f * 2.4;
      const radius = 0.1 * Math.exp(B * f * 2.4) + 0.08;
      const turns = 2 - Math.round(f);            // 안쪽 절반 2바퀴, 바깥 절반 1바퀴 → 한 바퀴에 정확히 제자리
      const theta = theta0 + 2 * Math.PI * turns * t;
      dots.push({ x: 0.5 + radius * Math.cos(theta), y: 0.5 + radius * Math.sin(theta), r: 0.042 - 0.02 * f, alpha: 0.95 - 0.6 * f });
    }
  }
  return dots;
}

export default {
  id: 'galaxy',
  category: 'spin',
  name: '은하',
  description: '나선 팔 셋이 돌며, 안쪽이 바깥보다 빨라 팔이 감겼다 풀린다.',
  tags: ['원형', '나선'],
  loop: { duration: 6000, seams: [0, 0.5], rest: 0, frame: loop },
};
