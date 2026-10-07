# dot-loaders

점으로 만든 대기(로딩) 애니메이션 연구실. 작은 캔버스 엔진 하나와 변형(variant) 여러 개, 그리고 캔버스가 없는 곳(WPF 등)에서 쓰도록 **스프라이트 시트로 굽는 기능**이 들어 있다.

시작은 claude.ai Code 탭의 2×2 네 점 대기 표시를 뜯어본 것이고([조사 노트](docs/claude-working-mark.md)), 그 재현(`claude-code`)을 기준점 삼아 독특한 형태를 더 만들어 가는 곳이다.

## 갤러리 열기

빌드 없음. 정적 파일만 서빙하면 된다 (ES 모듈이라 `file://` 로 더블클릭은 안 된다).

```bash
npm run dev
```

→ http://localhost:5173 . `python -m http.server 5173` 과 같다. `npx serve .` 도 된다.

갤러리에서 크기·속도·색을 바꾸고, ▶/■ 로 등장·퇴장을 보고, **PNG 시트** 버튼으로 `enter/loop/exit` 시트와 매니페스트 json 을 내려받는다.

## 다른 프로젝트에서 쓰기

### 웹 (ES 모듈)

```js
import { mount } from './dot-loaders/src/dots.js';
import './dot-loaders/src/variants/index.js';   // 전부 등록. 하나만 쓰려면 아래 참고

const loader = mount(document.querySelector('#loader'), {
  variant: 'claude-code',
  size: 20,            // 픽셀 한 변
  color: '#d97757',
});

// 응답이 오면: 이음새(seam)에서 퇴장 애니메이션 후 사라짐
loader.stop();
// 다시: 등장 → 반복
loader.play();
```

변형 하나만 쓰려면:

```js
import { mount, register } from './dot-loaders/src/dots.js';
import claudeCode from './dot-loaders/src/variants/claude-code.js';
register(claudeCode);
mount(el, { variant: 'claude-code', size: 20 });
```

git 서브모듈로 넣거나 `src/` 폴더를 복사하면 된다. GitHub 에 올라가 있으면 jsDelivr 로도 가져올 수 있다:
`https://cdn.jsdelivr.net/gh/praswna/dot-loaders@main/src/dots.js`

### 네이티브 앱 (WPF, 모바일 등): 스프라이트 시트

갤러리의 **PNG 시트** 버튼 또는 코드로 굽는다.

```js
import { bakeSpriteSheet, toPngBlob } from './src/dots.js';
const { canvas, manifest } = bakeSpriteSheet('claude-code', { phase: 'loop', frame: 48, fps: 30 });
// manifest = { variant, phase, frames: 75, speed: 33.3333, frame: 48, fps: 30, seams: [0,19,38,56], rest: 0 }
```

재생법은 claude.ai 와 같다. 높이 `frame` 인 창(Clip) 안에 시트를 넣고, `speed` ms 마다 `-i * frame` 만큼 위로 옮긴다. `enter` 시트를 한 번 → `loop` 시트를 반복 → 멈출 때는 `seams` 중 하나에 닿으면 `exit` 시트를 한 번. 모션 축소 설정이면 `rest` 프레임 한 장만 보여 준다.

## API

`src/dots.js`

| 함수 | 설명 |
|---|---|
| `register(variant)` | 변형 등록 |
| `get(id)`, `list()` | 등록된 변형 조회 |
| `mount(target, options)` | 캔버스(또는 부모 요소)에 붙이고 컨트롤러 반환 |
| `sample(variant, phase, t)` | 한 장면(점 목록) 계산 |
| `draw(ctx, frame, {size, color, background, offsetX, offsetY})` | 장면을 2D 컨텍스트에 그림 |
| `bakeSpriteSheet(variant, {phase, frame, fps, color, background, scale})` | 세로 시트 캔버스 + 매니페스트 |
| `toPngBlob(canvas)` | PNG Blob |

`mount` 옵션: `variant`, `size=48`, `color='#d97757'`, `background=null`, `speed=1`, `autoplay=true`, `enter=true`, `reducedMotion='auto'|true|false`

컨트롤러: `play()`, `stop({immediate})`, `pause()`, `resume()`, `set({...옵션})`, `seek(phase, t)`, `onState(fn)`, `destroy()`, `state`, `variant`, `canvas`

## 변형 만들기

`src/variants/내-변형.js` 를 만들고 `src/variants/index.js` 에 한 줄 추가한다. 좌표계는 한 변이 1 인 정사각형, 반지름도 비율이다.

```js
export default {
  id: 'my-loader', name: '이름', description: '한 줄 설명', tags: ['2x2'],
  loop: {
    duration: 1200,            // ms
    seams: [0, 0.5],           // 여기서 멈추면 어색하지 않은 t (정지 요청 시 exit 로 넘어가는 지점)
    rest: 0,                   // 모션 축소일 때 보여 줄 t
    frame(t) {                 // t: 0..1
      return [{ x: 0.5, y: 0.5, r: 0.1, alpha: 1 }];
      // 또는 { dots: [...], links: [{ a: 0, b: 1, alpha: 0.3, width: 0.012 }] }
    },
  },
  enter: { duration: 400, frame(t) { /* 등장 */ } },   // 선택
  exit:  { duration: 300, frame(t) { /* 퇴장 */ } },   // 선택
};
```

이징은 `src/easing.js` 에 모아 두었다 (`seg`, `lerp`, `easeOutBack`, `cubicBezier`, `polar` …).

점검:

```bash
npm run check
```

## 들어 있는 변형

| id | 이름 | 모양 |
|---|---|---|
| `claude-code` | Claude code 마크 | 2×2, 대각선 짝이 S자로 자리 교환 (재현) |
| `grid-rotate` | 네모 회전 | 2×2 가 통째로 90도씩, overshoot |
| `scissor` | 가위질 | 두 대각선 짝이 반대 방향으로 비껴 돌기 |
| `leapfrog` | 개구리 뛰기 | 가로 4점, 맨 뒤가 앞으로 뛰어넘기 |
| `dice` | 주사위 | 주사위 눈 1→6 변신 |
| `breathe` | 숨쉬기 | 3×3, 중심에서 퍼지는 맥동 |
| `orbit` | 궤도 | 기울어진 타원 궤도, 깊이감 |
| `helix` | 나선 | DNA 두 가닥 + 가로줄 |
| `sine-wave` | 물결 | 고전 사인파 5점 |
| `constellation` | 별자리 | 리사주로 떠다니다 선으로 이어짐 |

## 배포

`main` 에 푸시하면 `.github/workflows/pages.yml` 이 갤러리를 GitHub Pages 로 올리고 오른쪽 아래에 `v빌드시각 · 커밋해시` 를 표시한다. 저장소 Settings → Pages → Source 를 **GitHub Actions** 로 한 번 바꿔 두어야 한다.

## 라이선스

MIT. Anthropic 의 원본 스프라이트 PNG 는 포함하지 않으며, `claude-code` 는 관찰한 움직임을 수식으로 다시 쓴 재현이다.
