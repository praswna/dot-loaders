// 물결: 고전적인 가로 다섯 점 사인파. 위로 갈 때 살짝 커진다.

const N = 5;

function loop(t) {
  const dots = [];
  for (let i = 0; i < N; i++) {
    const ph = 2 * Math.PI * t - i * 0.9;
    dots.push({ x: 0.14 + 0.18 * i, y: 0.5 - 0.2 * Math.sin(ph), r: 0.058 + 0.014 * Math.sin(ph) });
  }
  return dots;
}

export default {
  id: 'sine-wave',
  category: 'wave',
  name: '물결',
  description: '가로 다섯 점이 사인파로 출렁인다. 기준점 삼기 좋은 고전형.',
  tags: ['가로', '고전'],
  loop: { duration: 1200, seams: [0], frame: loop },
};
