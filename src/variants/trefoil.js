// 삼엽 매듭: 원환면 위를 둘레 방향으로 2번, 관 방향으로 3번 감는 (2,3) 원환 매듭.
//   K(s) = ((R + r cos 3s) cos 2s, (R + r cos 3s) sin 2s, r sin 3s)
// 매듭은 z 축으로 120° 돌리면 자기 자신이 된다(매개변수가 4π/3 밀림). 그래서 120° 도는 동안
// 점들을 매듭을 따라 4π/3 만큼 흘려 보내면 한 바퀴가 정확히 이어진다. 구슬 셋이 매듭을 타고 돈다.

import { isSmall } from '../easing.js';

const N = 48, RR = 1, rr = 0.48, TILT = 0.75, SCALE = 0.27;
const K = (s) => [(RR + rr * Math.cos(3 * s)) * Math.cos(2 * s), (RR + rr * Math.cos(3 * s)) * Math.sin(2 * s), rr * Math.sin(3 * s)];

function loop(t, _seam, view) {
  const small = isSmall(view), n = small ? 24 : N;   // 작게: 점은 구슬 셋만, 매듭은 굵은 선
  const spin = (2 * Math.PI * t) / 3, c = Math.cos(spin), s = Math.sin(spin);
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const dots = [], links = [];
  for (let j = 0; j < n; j++) {
    let [x, y, z] = K((2 * Math.PI * j) / n - (4 * Math.PI * t) / 3);
    [x, y] = [c * x - s * y, s * x + c * y];
    const yy = ct * y - st * z, zz = st * y + ct * z;
    const d = Math.max(0, Math.min(1, 0.5 + zz * 0.55));
    const bead = j % (n / 3) === 0;
    dots.push({ x: 0.5 + SCALE * x, y: 0.5 + SCALE * yy, r: bead ? (small ? 0.07 : 0.045) : small ? 0 : 0.012 + 0.016 * d, alpha: bead ? 0.6 + 0.4 * d : 0.3 + 0.7 * d });
    links.push({ a: j, b: (j + 1) % n, width: small ? 0.05 : 0.016, alpha: (small ? 0.3 : 0.15) + 0.45 * d });
  }
  return { dots, links };
}

export default {
  id: 'trefoil',
  category: 'science',
  shape: 'free',
  name: '삼엽 매듭',
  description: '원환면을 두 번·세 번 감는 (2,3) 매듭. 120° 대칭을 이용해 구슬 셋이 매듭을 타고 끝없이 돈다.',
  tags: ['매듭', '3D', '선'],
  loop: { duration: 4000, seams: [0, 0.5], frame: loop },
};
