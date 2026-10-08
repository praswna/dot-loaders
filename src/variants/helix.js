// 나선: DNA 처럼 두 가닥이 꼬이며 흐른다. 마주 보는 점끼리 가는 선으로 잇는다.

const N = 6;

function loop(t) {
  const dots = [];
  const links = [];
  for (let strand = 0; strand < 2; strand++) {
    for (let j = 0; j < N; j++) {
      const x = 0.14 + (0.72 * j) / (N - 1);
      const ph = 2 * Math.PI * t + 2 * Math.PI * (j / (N - 1)) * 0.8 + strand * Math.PI;
      const depth = (Math.cos(ph) + 1) / 2;
      dots.push({ x, y: 0.5 + 0.2 * Math.sin(ph), r: 0.03 + 0.03 * depth, alpha: 0.45 + 0.55 * depth });
    }
  }
  for (let j = 0; j < N; j++) links.push({ a: j, b: j + N, alpha: 0.22, width: 0.012 });
  return { dots, links };
}

export default {
  id: 'helix',
  category: 'wave',
  name: '나선',
  description: '두 가닥이 DNA 처럼 꼬이며 흐른다. 마주 보는 점은 선으로 이어진다.',
  tags: ['가로', '3D', '선'],
  loop: { duration: 2000, seams: [0, 0.5], frame: loop },
};
