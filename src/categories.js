// 움직임이 비슷한 변형끼리 묶은 카테고리. 각 변형 파일의 `category` 가 여기 id 중 하나여야 한다.
// 순서는 갤러리에 보이는 순서.
export const categories = [
  { id: 'swap',   name: '자리 바꾸기', description: '몇 개의 점이 서로 자리를 바꾸거나 통째로 옮겨 앉는다. 정지 순간이 또렷하다.' },
  { id: 'spin',   name: '회전',       description: '중심을 두고 빙글빙글 돈다. 고리·궤도·바퀴.' },
  { id: 'wave',   name: '물결·맥동',   description: '점은 제자리 근처에 있고 크기·높이·밝기가 파도처럼 번진다.' },
  { id: 'physics', name: '물리',      description: '중력·충돌·포물선처럼 실제 물체 같은 움직임.' },
  { id: 'morph',  name: '변신',       description: '점의 수나 배치가 바뀌며 다른 모양이 된다.' },
  { id: 'grid',   name: '격자·신호',   description: '격자 칸을 한 걸음씩 옮겨 가거나, 켜고 꺼서 무언가를 센다.' },
  { id: 'drift',  name: '흐름',       description: '곡선을 따라 미끄러지듯 흘러가며 궤적을 남긴다.' },
  { id: 'science', name: '수학·물리', description: '실제 방정식을 풀어 움직인다. 삼체 문제, 4차원 회전, 양자 파동, 푸리에 급수, 베셀 함수, 케플러, 매듭, 위상수학, 확률, 혼돈, 프랙털.' },
];

export const categoryOf = (id) => categories.find((c) => c.id === id);

// 두 번째 축: 점이 놓이는 배치. 갤러리에서 카테고리 칩 아래 줄(하위 칩)로 거른다.
// 각 변형 파일의 `shape` 가 여기 id 중 하나여야 한다.
export const shapes = [
  { id: 'row',    name: '가로줄' },
  { id: '2x2',    name: '2×2' },
  { id: '3x3',    name: '3×3' },
  { id: 'grid',   name: '격자' },
  { id: 'circle', name: '원형' },
  { id: 'free',   name: '자유' },
];

export const shapeOf = (id) => shapes.find((s) => s.id === id);
