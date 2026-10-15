// 공용 이징·보간 도우미. 모든 변형(variants/*.js)이 여기서 가져다 쓴다.

export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const lerp = (a, b, t) => a + (b - a) * t;

/** 그려질 크기가 작은가 (36px 미만). frame(t, seam, view) 의 view 로 판단. 크기를 모르면 크다고 본다. */
export const SMALL_PX = 36;
export const isSmall = (view) => (view?.size ?? Infinity) < SMALL_PX;

/** 구간 [a,b] 를 0..1 로 정규화하고 바깥은 잘라낸다. */
export const seg = (t, a, b) => clamp01((t - a) / (b - a));

export const easeInQuad = (t) => t * t;
export const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeInCubic = (t) => t * t * t;
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** 3차 베지에 곡선 위의 점. p* 는 [x,y]. */
export function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
}

/** 각도(라디안, 화면 좌표: y 아래가 +)로 중심 (cx,cy) 에서 반지름 r 만큼 떨어진 점. */
export const polar = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
