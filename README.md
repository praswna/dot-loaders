# dot-loaders

점으로 만든 대기(로딩) 애니메이션 연구실. 작은 캔버스 엔진 하나와 변형(variant) 여러 개, 그리고 캔버스가 없는 곳(WPF 등)에서 쓰도록 **스프라이트 시트로 굽는 기능**이 들어 있다.

시작은 claude.ai Code 탭의 2×2 네 점 대기 표시를 뜯어본 것이고([조사 노트](docs/claude-working-mark.md)), 그 재현(`claude-code`)을 기준점 삼아 독특한 형태를 더 만들어 가는 곳이다.

## 갤러리 열기

빌드 없음. 정적 파일만 서빙하면 된다 (ES 모듈이라 `file://` 로 더블클릭은 안 된다).

```bash
npm run dev
```

→ http://localhost:5173 . 의존성 없는 작은 서버(`tools/serve.mjs`)가 ES 모듈용 MIME 과 `no-store` 캐시 헤더를 보낸다. `python -m http.server 5173` 이나 `npx serve .` 도 되지만, Windows 의 python 은 `.js` 를 `text/plain` 으로 보내 모듈이 안 뜰 수 있다.

Windows 에서는 `dev.bat` 을 더블클릭하면 된다 (Node.js, 없으면 Python 으로 서버를 띄우고 브라우저를 연다. `dev.bat 8080` 처럼 포트를 줄 수 있다).

OS 의 **모션 축소**(Windows: 설정 → 접근성 → 시각 효과 → 애니메이션 효과 끔, macOS: 손쉬운 사용 → 동작 줄이기)가 켜져 있으면 엔진은 정지 화면 한 장만 그린다. 갤러리는 이를 알려 주고 "OS 모션 축소 무시" 스위치로 이 페이지에서만 움직이게 할 수 있다. 코드에서는 `mount(el, { reducedMotion: false })`.

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

// 응답이 오면: 이음새(seam)에서 한 점으로 모인 뒤 사라짐
loader.stop();
// 다시: 한 점에서 퍼지며 등장 → 반복
loader.play();
// 다른 변형으로: 다음 이음새에서 한 점을 거쳐 넘어감
loader.next('snake');
```

### 한 점 규칙과 순환

모든 변형은 가운데 **한 점**(`POINT`, 반지름 0.065)에서 퍼져 나오며 시작하고, 끝날 때는 한 점으로 모인다. `enter`/`exit` 를 직접 쓰지 않은 변형에는 엔진이 공통 전이를 붙인다(장면의 점들이 가운데로 모여 하나가 되고 작아짐). 그래서 변형 사이를 끊김 없이 오갈 수 있다.

```js
// 한 점 → claude-code → 한 점 → ring → 한 점 → snake → 한 점 → claude-code …
const loader = mount(el, { variant: ['claude-code', 'ring', 'snake'], loops: 1, dwell: 3000 });
loader.next();          // 지금 바로 다음 변형으로 (다음 이음새에서 한 점을 거쳐)
loader.next('dice');    // 특정 변형으로
loader.set({ variant: 'orbit' });  // 돌고 있는 동안 바꿔도 한 점을 거친다
```

`loops` 는 변형마다 최소 바퀴 수, `dwell` 은 최소 머무는 시간(ms). 둘 다 채운 뒤 첫 이음새에서 넘어간다.

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

브라우저 없이 명령줄에서 구우려면 (의존성 없음):

```bash
node tools/bake.mjs claude-code --out dist            # enter/loop/exit 시트 + json
node tools/bake.mjs all --frame 64 --fps 30 --contact  # 전부, 프레임 확인용 contact 이미지 포함
```

Windows 에서는 `bake.bat` 을 더블클릭하면 전부를 `dist\` 에 굽는다. 인자를 주면 그대로 `tools/bake.mjs` 에 넘긴다: `bake.bat claude-code --frame 64 --out C:\MyApp\Assets`.

재생법은 claude.ai 와 같다. 높이 `frame` 인 창(Clip) 안에 시트를 넣고, `speed` ms 마다 `-i * frame` 만큼 위로 옮긴다. `enter` 시트를 한 번 → `loop` 시트를 반복 → 멈출 때는 `seams` 중 하나에 닿으면 `exit` 시트를 한 번. 모션 축소 설정이면 `rest` 프레임 한 장만 보여 준다. 모든 변형의 `enter` 첫 장과 `exit` 끝 장은 같은 한 점이라, 다른 변형의 시트로 바로 이어 붙일 수 있다. 구워진 `exit` 시트는 `rest` 이음새 장면에서 시작한다(매니페스트 `seam`).

## API

`src/dots.js`

| 함수 | 설명 |
|---|---|
| `register(variant)` | 변형 등록 |
| `get(id)`, `list()` | 등록된 변형 조회 |
| `mount(target, options)` | 캔버스(또는 부모 요소)에 붙이고 컨트롤러 반환 |
| `sample(variant, phase, t, seam?)` | 한 장면(점 목록) 계산. `exit` 는 `seam`(이음새 t)에서 이어진다 |
| `POINT` | 모든 변형이 거쳐 가는 한 점 `{x:.5, y:.5, r:.065}` |
| `draw(ctx, frame, {size, color, background, offsetX, offsetY})` | 장면을 2D 컨텍스트에 그림 |
| `bakeSpriteSheet(variant, {phase, frame, fps, color, background, scale})` | 세로 시트 캔버스 + 매니페스트 |
| `toPngBlob(canvas)` | PNG Blob |

`mount` 옵션: `variant`(id 또는 id 배열), `size=48`, `color='#d97757'`, `background=null`, `speed=1`, `autoplay=true`, `enter=true`, `reducedMotion='auto'|true|false`, `loops=1`, `dwell=0`

컨트롤러: `play()`, `stop({immediate})`, `next(id?)`, `pause()`, `resume()`, `set({...옵션})`, `seek(phase, t)`, `onState(fn)`, `destroy()`, `state`, `variant`, `cycle`, `canvas`

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
  enter: { duration: 400, frame(t) { /* 등장 */ } },        // 선택. 없으면 공통 전이(한 점에서 퍼짐)
  exit:  { duration: 300, frame(t, seam) { /* 퇴장 */ } },  // 선택. 없으면 공통 전이(한 점으로 모임)
};
```

직접 쓸 때도 `enter` 의 t=0 과 `exit` 의 t=1 은 가운데 한 점(`POINT`)이어야 한다. 테스트가 이를 검사한다.

이징은 `src/easing.js` 에 모아 두었다 (`seg`, `lerp`, `easeOutBack`, `cubicBezier`, `polar` …).

점검 (문법 + 모든 변형 장면 샘플링 + 엔진 상태 전이 테스트):

```bash
npm test
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
| `typing` | 입력 중 | 채팅 "입력 중" 표시, 세 점이 차례로 튐 |
| `ring` | 고리 스피너 | 열두 점 고리를 밝은 머리가 돌며 꼬리를 남김 |
| `cradle` | 뉴턴의 요람 | 매달린 구슬 다섯, 양 끝이 번갈아 튀어 오름 |
| `mitosis` | 세포 분열 | 하나 → 둘 → 넷 → 다시 하나 |
| `hourglass` | 모래시계 | 모래알이 떨어지고 다 떨어지면 통째로 뒤집힘 |
| `snake` | 스네이크 | 4×4 격자를 한 바퀴 도는 다섯 마디 뱀 |
| `glider` | 글라이더 | 생명 게임의 글라이더, 5×5 토러스에서 20세대에 한 바퀴 |
| `juggle` | 저글링 | 공 세 개가 두 손 사이를 포물선으로 오감 |
| `radar` | 레이더 | 탐지선이 돌며 표적이 밝아졌다 식음 |
| `gears` | 톱니바퀴 | 톱니 8개와 6개가 맞물려 반대로 돎 |
| `infinity` | 무한 | ∞ 곡선을 따라 꼬리를 끌며 달림 |
| `firework` | 불꽃놀이 | 포탄이 올라가 터지고 불티가 내려앉음 |
| `pong` | 퐁 | 공이 채와 벽 사이를 튀고 채가 따라감 |
| `binary` | 이진 카운터 | 네 점이 0000 부터 1111 까지 셈 |
| `morse` | 모스 부호 | "WAIT" 를 모스 부호로 침 |
| `galaxy` | 은하 | 나선 팔 셋, 안쪽이 빨라 감겼다 풀림 |
| `interference` | 간섭무늬 | 두 파원의 물결이 5×5 점 위에서 겹침 |

## 배포

`main` 에 푸시하면 `.github/workflows/pages.yml` 이 갤러리를 GitHub Pages 로 올리고 오른쪽 아래에 `v빌드시각 · 커밋해시` 를 표시한다.

**Pages 는 공개 저장소이거나 유료 플랜(Pro/Team)이어야 켜진다.** 비공개 저장소 + 무료 플랜이면 워크플로가 `configure-pages` 단계에서 `Resource not accessible by integration` 으로 멈추고 사이트가 만들어지지 않는다. 이때는 저장소를 공개로 바꾸거나(Settings → General → Danger Zone → Change visibility), 로컬에서 `npm run dev` / `dev.bat` 으로 본다. 공개로 바꾼 뒤에도 안 되면 Settings → Pages → Source 를 **GitHub Actions** 로 바꾸고 Actions 탭에서 `pages` 워크플로를 다시 실행한다.

갤러리 주소: https://praswna.github.io/dot-loaders/

## 라이선스

MIT. Anthropic 의 원본 스프라이트 PNG 는 포함하지 않으며, `claude-code` 는 관찰한 움직임을 수식으로 다시 쓴 재현이다.
