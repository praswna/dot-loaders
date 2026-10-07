// 궤도: 네 점이 기울어진 타원 궤도를 돈다. 앞으로 올수록 크고 진하게, 뒤로 가면 작고 옅게.

const A = 0.36, B = 0.15;         // 타원 반지름
const TILT = (-28 * Math.PI) / 180;
const cosT = Math.cos(TILT), sinT = Math.sin(TILT);

function loop(t) {
  const dots = [];
  for (let i = 0; i < 4; i++) {
    const th = 2 * Math.PI * t + (i * Math.PI) / 2;
    const ex = A * Math.cos(th), ey = B * Math.sin(th);
    const depth = (Math.sin(th) + 1) / 2; // 0 뒤 .. 1 앞
    dots.push({
      x: 0.5 + ex * cosT - ey * sinT,
      y: 0.5 + ex * sinT + ey * cosT,
      r: 0.045 + 0.04 * depth,
      alpha: 0.45 + 0.55 * depth,
      depth,
    });
  }
  dots.sort((p, q) => p.depth - q.depth); // 앞의 점이 위에 그려지게
  return dots;
}

export default {
  id: 'orbit',
  name: '궤도',
  description: '네 점이 기울어진 타원 궤도를 돈다. 가까운 점은 크고 진하다.',
  tags: ['원형', '3D'],
  loop: { duration: 2200, seams: [0, 0.25, 0.5, 0.75], frame: loop },
};
