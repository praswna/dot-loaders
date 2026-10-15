// 초입방체: 4차원 정육면체(테서랙트)의 꼭짓점 16개와 모서리 32개.
// XW 평면과 YZ 평면에서 동시에 같은 각도로 도는 이중 회전(등각 회전)을 하고, 4D → 3D → 2D 로 원근 투영한다.
// 정육면체 대칭 덕분에 90도 돌면 같은 모양(꼭짓점 번호만 바뀜)이 되므로 반복 한 바퀴 = 90도.
// 안쪽 정육면체가 바깥으로 뒤집혀 나오는 것처럼 보이는 게 4차원 회전의 그림자다.

import { isSmall } from '../easing.js';

const V = Array.from({ length: 16 }, (_, i) => [0, 1, 2, 3].map((b) => ((i >> b) & 1 ? 1 : -1)));
const EDGES = [];
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) if (!(i & (1 << b))) EDGES.push([i, i | (1 << b)]);

const W_EYE = 3, Z_EYE = 4.2;               // 4D, 3D 카메라 거리
const TILT_X = 0.5, TILT_Y = 0.62;          // 고정 기울기 (3D 에서 비스듬히 보기)
const SCALE = 0.21;

function project(p, th) {
  const c = Math.cos(th), s = Math.sin(th);
  let [x, y, z, w] = p;
  [x, w] = [c * x - s * w, s * x + c * w];  // XW 회전
  [y, z] = [c * y - s * z, s * y + c * z];  // YZ 회전
  const k4 = 1 / (W_EYE - w);                // 4D → 3D 원근
  x *= k4 * 2; y *= k4 * 2; z *= k4 * 2;
  // 고정 기울기
  let cy = Math.cos(TILT_Y), sy = Math.sin(TILT_Y);
  [x, z] = [cy * x + sy * z, -sy * x + cy * z];
  const cx = Math.cos(TILT_X), sx = Math.sin(TILT_X);
  [y, z] = [cx * y - sx * z, sx * y + cx * z];
  const k3 = Z_EYE / (Z_EYE - z);            // 3D → 2D 원근
  return { x: 0.5 + SCALE * x * k3, y: 0.5 + SCALE * y * k3, depth: (w + 1.42) / 2.84, near: z };
}

function loop(t, _seam, view) {
  const small = isSmall(view);                  // 작게: 모서리를 굵게, 꼭짓점은 작게 (모양은 선이 만든다)
  const th = (t * Math.PI) / 2;
  const dots = V.map((p) => {
    const q = project(p, th);
    const d = Math.max(0, Math.min(1, q.depth));
    return { x: q.x, y: q.y, r: small ? 0.03 + 0.015 * d : 0.03 + 0.022 * d, alpha: 0.45 + 0.55 * d };
  });
  const links = EDGES.map(([a, b]) => ({ a, b, width: small ? 0.04 : 0.011, alpha: (small ? 0.25 : 0.12) + 0.3 * Math.min(dots[a].alpha, dots[b].alpha) }));
  return { dots, links };
}

export default {
  id: 'tesseract',
  category: 'science',
  shape: 'free',
  name: '초입방체',
  description: '4차원 정육면체가 두 평면에서 동시에 돈다. 안쪽 정육면체가 바깥으로 뒤집혀 나오는 4D 회전의 그림자.',
  tags: ['4D', '선', '투영'],
  loop: {
    duration: 3200,
    seams: [0, 0.5],
    frame: loop,
  },
};
