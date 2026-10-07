// 모스 부호: "WAIT" 를 한 글자씩 친다. 위의 전건(키)이 신호에 맞춰 깜빡이고, 아래에 그 글자의 점·선이 차례로 밝아진다.
// 단위: 점 1, 선 3, 부호 사이 1, 글자 사이 3, 단어 뒤 7.

const LETTERS = [['W', '.--'], ['A', '.-'], ['I', '..'], ['T', '-']];
const UNIT = 0.052, R = 0.04, LINE_Y = 0.64, KEY = [0.5, 0.3];

// 타임라인 만들기: [{ letter, symbol, start, end }] (단위 시간)
const timeline = [];
let clock = 0;
for (const [, code] of LETTERS) {
  const letterStart = clock;
  for (let i = 0; i < code.length; i++) {
    const len = code[i] === '.' ? 1 : 3;
    timeline.push({ letter: letterStart, idx: i, start: clock, end: clock + len });
    clock += len + 1;
  }
  clock += 2; // 부호 뒤 1 + 글자 사이 2 = 3
}
const TOTAL = clock + 4; // 단어 뒤 여백
const LETTER_STARTS = [...new Set(timeline.map((s) => s.letter))];

function loop(t) {
  const now = t * TOTAL;
  const dots = [], links = [];
  // 현재 글자: 가장 최근에 시작한 글자 (여백 구간엔 마지막 글자)
  let li = 0;
  for (let i = 0; i < LETTER_STARTS.length; i++) if (now >= LETTER_STARTS[i] - 0.5) li = i;
  const code = LETTERS[li][1];
  const symbols = timeline.filter((s) => s.letter === LETTER_STARTS[li]);
  const width = symbols.reduce((w, s) => w + (code[s.idx] === '.' ? 1 : 3) + 1, -1) * UNIT;
  let x = 0.5 - width / 2;
  let keyOn = 0;
  for (const s of symbols) {
    const isDash = code[s.idx] === '-';
    const span = (isDash ? 3 : 1) * UNIT;
    const active = now >= s.start && now < s.end;
    const done = now >= s.end;
    const a = active ? 1 : done ? 0.55 : 0.2;
    if (active) keyOn = 1;
    if (isDash) {
      const i0 = dots.length;
      dots.push({ x: x + R, y: LINE_Y, r: R, alpha: a }, { x: x + span - R, y: LINE_Y, r: R, alpha: a });
      links.push({ a: i0, b: i0 + 1, alpha: a, width: R * 2 });
    } else {
      dots.push({ x: x + R, y: LINE_Y, r: R, alpha: a });
    }
    x += span + UNIT;
  }
  // 전건: 눌리면 커지고 밝다. 깜빡이는 전구
  dots.push({ x: KEY[0], y: KEY[1], r: 0.07 + 0.03 * keyOn, alpha: 0.25 + 0.75 * keyOn });
  for (let k = 0; k < 8; k++) {
    const ang = (2 * Math.PI * k) / 8;
    dots.push({ x: KEY[0] + 0.14 * Math.cos(ang), y: KEY[1] + 0.14 * Math.sin(ang), r: 0.012, alpha: 0.5 * keyOn });
  }
  return { dots, links };
}

export default {
  id: 'morse',
  name: '모스 부호',
  description: '"WAIT" 를 모스 부호로 친다. 전건이 깜빡이고 점·선이 차례로 밝아진다.',
  tags: ['선', '문자'],
  loop: { duration: TOTAL * 130, seams: LETTER_STARTS.map((s) => s / TOTAL), rest: 0, frame: loop },
};
