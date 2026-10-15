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

OS 의 **모션 축소**(Windows: 설정 → 접근성 → 시각 효과 → 애니메이션 효과 끔, macOS: 손쉬운 사용 → 동작 줄이기)가 켜져 있으면 엔진은 정지 화면 한 장만 그린다. 갤러리는 위쪽 안내문에 이를 알려 주고, 그 안의 스위치로 이 페이지에서만 움직이게 할 수 있다. 코드에서는 `mount(el, { reducedMotion: false })`.

갤러리 카드에서 ▶/■ 로 등장·퇴장을 보고, **PNG 시트** 버튼으로 `enter/loop/exit` 시트와 매니페스트 json 을 내려받는다.

## 다른 프로젝트에서 쓰기

### 장바구니: 고른 것만 넘기기

갤러리 카드의 **담기** 로 쓸 변형만 고른 뒤 왼쪽 아래 **🛒 장바구니** 를 연다. 담은 것만 순환하는 미리 보기와 함께:

- **전달문 복사**: 변형 목록, 미리 보기 링크, 고른 것만 불러오는 코드(CDN 주소는 배포된 커밋에 고정), 복사할 파일 목록, 시트 굽기 명령을 한 글로. 다른 프로젝트(사람이든 AI 든)에 그대로 붙여 넣는다.
- **코드만 복사**: `./dot-loaders/` 에 복사해 둔 경우의 import·register·mount 코드.
- **링크 복사**: `…/#cart=orbit,snake` 처럼 장바구니를 담은 갤러리 주소. 열면 그 장바구니가 열린다.
- **PNG 시트 모두**: 담은 변형의 시트와 json 을 한꺼번에 내려받기.

장바구니는 이 브라우저에 기억된다. 전달문 만들기는 `cart.js` (DOM 없는 함수, `test/cart.test.mjs`).

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
node tools/bake.mjs orbit,snake                        # 쉼표로 이으면 그것들만
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
| `sample(variant, phase, t, seam?, view?)` | 한 장면(점 목록) 계산. `exit` 는 `seam`(이음새 t)에서 이어진다. `view = { size }` 를 주면 그 크기용 장면 |
| `POINT` | 모든 변형이 거쳐 가는 한 점 `{x:.5, y:.5, r:.065}` |
| `draw(ctx, frame, {size, color, background, offsetX, offsetY})` | 장면을 2D 컨텍스트에 그림 |
| `bakeSpriteSheet(variant, {phase, frame, fps, color, background, scale})` | 세로 시트 캔버스 + 매니페스트 |
| `toPngBlob(canvas)` | PNG Blob |

`mount` 옵션: `variant`(id 또는 id 배열), `size=48`, `color='#d97757'`, `background=null`, `speed=1`, `autoplay=true`, `enter=true`, `reducedMotion='auto'|true|false`, `loops=1`, `dwell=0`

컨트롤러: `play()`, `stop({immediate})`, `next(id?)`, `pause()`, `resume()`, `set({...옵션})`, `seek(phase, t)`, `onState(fn)`, `destroy()`, `state`, `variant`, `cycle`, `canvas`

## 보관함

안 쓸 변형은 지우지 말고 보관한다. 갤러리 카드의 **보관** 버튼을 누르면 맨 아래 "보관함" 으로 옮겨지고, 카테고리 칩에서도 빠진다. **꺼내기** 로 되돌린다.

- 개발 서버(`npm run dev`, `dev.bat`)로 연 갤러리에서는 **파일이 실제로 옮겨진다.** `src/variants/<id>.js` → `src/variants/archive/<id>.js`, 라이브러리 목록 `src/variants/index.js` 에서 빠지고 `src/variants/archive/index.js` 에 들어간다. 바뀐 파일은 git 으로 커밋한다.
- 다른 서버나 정적 호스팅으로 열면 파일을 못 건드리므로 그 브라우저에만 기억한다.
- 명령줄로도 된다:

```bash
node tools/archive.mjs archive dice    # 보관
node tools/archive.mjs restore dice    # 꺼내기
node tools/archive.mjs list            # 보관된 것
```

보관된 변형은 라이브러리(`import './src/variants/index.js'`)와 `tools/bake.mjs all` 에 들어가지 않는다.

## 변형 만들기

`src/variants/내-변형.js` 를 만들고 `src/variants/index.js` 에 한 줄 추가한다. 좌표계는 한 변이 1 인 정사각형, 반지름도 비율이다.

```js
export default {
  id: 'my-loader', category: 'swap', shape: '2x2', name: '이름', description: '한 줄 설명', tags: ['2x2'],
  loop: {
    duration: 1200,            // ms
    seams: [0, 0.5],           // 여기서 멈추면 어색하지 않은 t (정지 요청 시 exit 로 넘어가는 지점)
    rest: 0,                   // 모션 축소일 때 보여 줄 t
    frame(t, seam, view) {     // t: 0..1, view.size: 그려질 크기(px, 모를 수도 있음)
      return [{ x: 0.5, y: 0.5, r: 0.1, alpha: 1 }];
      // 또는 { dots: [...], links: [{ a: 0, b: 1, alpha: 0.3, width: 0.012 }] }
    },
  },
  enter: { duration: 400, frame(t) { /* 등장 */ } },        // 선택. 없으면 공통 전이(한 점에서 퍼짐)
  exit:  { duration: 300, frame(t, seam) { /* 퇴장 */ } },  // 선택. 없으면 공통 전이(한 점으로 모임)
};
```

직접 쓸 때도 `enter` 의 t=0 과 `exit` 의 t=1 은 가운데 한 점(`POINT`)이어야 한다. 테스트가 이를 검사한다.

**작은 크기:** 엔진은 그릴 크기를 `view.size` 로 넘긴다(`mount` 의 `size`, 시트의 `frame`). `isSmall(view)`(36px 미만, `src/easing.js`)이면 점·선 수를 줄이고 굵혀서 20px 에서도 모양이 읽히게 한다. 수학·물리 변형들이 이렇게 한다. 크기를 모르면(`sample` 에 view 없이) 큰 쪽으로 그린다. 선은 어느 크기에서든 최소 0.8px 로 그린다.

이징은 `src/easing.js` 에 모아 두었다 (`seg`, `lerp`, `easeOutBack`, `cubicBezier`, `polar` …).

점검 (문법 + 모든 변형 장면 샘플링 + 엔진 상태 전이 테스트):

```bash
npm test
```

## 들어 있는 변형

움직임이 비슷한 것끼리 카테고리로 묶었다 (`src/categories.js`, 변형마다 `category`). 갤러리는 카테고리별로 보여 주고, 위쪽 칩으로 거른다.
칩은 두 줄이다. 윗줄은 움직임 카테고리, 아랫줄은 점의 배치(`shape`: 가로줄·2×2·3×3·격자·원형·자유)로, 고른 카테고리 안에서 다시 거른다. 숫자는 그 칸에 든 변형 수.

### 자리 바꾸기 `swap`

몇 개의 점이 서로 자리를 바꾸거나 통째로 옮겨 앉는다. 정지 순간이 또렷하다.

| id | 이름 | 모양 |
|---|---|---|
| `claude-code` | Claude code 마크 | 2×2, 대각선 짝이 S자로 자리 교환 (재현) |
| `grid-rotate` | 네모 회전 | 2×2 가 통째로 90도씩, overshoot |
| `scissor` | 가위질 | 두 대각선 짝이 반대 방향으로 비껴 돌기 |
| `leapfrog` | 개구리 뛰기 | 가로 4점, 맨 뒤가 앞으로 뛰어넘기 |

### 회전 `spin`

중심을 두고 빙글빙글 돈다. 고리·궤도·바퀴.

| id | 이름 | 모양 |
|---|---|---|
| `orbit` | 궤도 | 세 점의 3D 원 궤도, 궤도면이 기울며 돌아 모양이 바뀜 |
| `ring` | 고리 스피너 | 열두 점 고리를 밝은 머리가 돌며 꼬리를 남김 |
| `radar` | 레이더 | 탐지선이 돌며 표적이 밝아졌다 식음 |
| `gears` | 톱니바퀴 | 톱니 8개와 6개가 맞물려 반대로 돎 |
| `galaxy` | 은하 | 나선 팔 셋, 안쪽이 빨라 감겼다 풀림 |

### 물결·맥동 `wave`

점은 제자리 근처에 있고 크기·높이·밝기가 파도처럼 번진다.

| id | 이름 | 모양 |
|---|---|---|
| `breathe` | 숨쉬기 | 3×3, 중심에서 퍼지는 맥동 |
| `helix` | 나선 | DNA 두 가닥 + 가로줄 |
| `sine-wave` | 물결 | 고전 사인파 5점 |
| `typing` | 입력 중 | 채팅 "입력 중" 표시, 세 점이 차례로 튐 |
| `interference` | 간섭무늬 | 두 파원의 물결이 5×5 점 위에서 겹침 |

### 물리 `physics`

중력·충돌·포물선처럼 실제 물체 같은 움직임.

| id | 이름 | 모양 |
|---|---|---|
| `cradle` | 뉴턴의 요람 | 매달린 구슬 다섯, 양 끝이 번갈아 튀어 오름 |
| `hourglass` | 모래시계 | 모래알이 떨어지고 다 떨어지면 통째로 뒤집힘 |
| `juggle` | 저글링 | 공 세 개가 두 손 사이를 포물선으로 오감 |
| `firework` | 불꽃놀이 | 포탄이 올라가 터지고 불티가 내려앉음 |
| `pong` | 퐁 | 공이 채와 벽 사이를 튀고 채가 따라감 |

### 변신 `morph`

점의 수나 배치가 바뀌며 다른 모양이 된다.

| id | 이름 | 모양 |
|---|---|---|
| `dice` | 주사위 | 주사위 눈 1→6 변신 |
| `mitosis` | 세포 분열 | 하나 → 둘 → 넷 → 다시 하나 |

### 격자·신호 `grid`

격자 칸을 한 걸음씩 옮겨 가거나, 켜고 꺼서 무언가를 센다.

| id | 이름 | 모양 |
|---|---|---|
| `snake` | 스네이크 | 4×4 격자를 한 바퀴 도는 다섯 마디 뱀 |
| `glider` | 글라이더 | 생명 게임의 글라이더, 5×5 토러스에서 20세대에 한 바퀴 |
| `binary` | 이진 카운터 | 네 점이 0000 부터 1111 까지 셈 |
| `morse` | 모스 부호 | "WAIT" 를 모스 부호로 침 |

### 흐름 `drift`

곡선을 따라 미끄러지듯 흘러가며 궤적을 남긴다.

| id | 이름 | 모양 |
|---|---|---|
| `constellation` | 별자리 | 리사주로 떠다니다 선으로 이어짐 |
| `infinity` | 무한 | ∞ 곡선을 따라 꼬리를 끌며 달림 |

### 수학·물리 `science`

실제 방정식을 풀어 움직인다. 반복 한 바퀴가 정확히 이어지도록 주기와 대칭을 이용했다.

| id | 이름 | 모양 |
|---|---|---|
| `three-body` | 삼체 8자 | 같은 질량 셋이 중력만으로 8자 곡선 하나를 쫓아 도는 삼체 문제 주기해(Chenciner–Montgomery). 뉴턴 방정식을 RK4 로 적분(한 주기 닫힘 오차 2×10⁻⁸), 1/3 주기마다 같은 장면 |
| `tesseract` | 초입방체 | 4차원 정육면체가 XW·YZ 평면에서 동시에 도는 등각 회전, 4D→3D→2D 원근 투영. 90도마다 같은 모양 |
| `quantum` | 양자 진동자 | 2차원 조화 진동자의 고유상태 셋(에너지 ω·2ω·3ω)을 겹친 확률밀도 \|ψ\|² 를 7×7 점으로. 2π/ω 주기 |
| `fourier` | 푸리에 원 | 하트 곡선을 DFT 로 분해한 계수대로 원(주전원)을 이어 돌려, 끝점이 하트를 그림 |
| `drum` | 북 막 | 원형 막의 진동 모드 (m=1, n=2). 베셀 함수 J₁ 을 급수로 계산, 마디 원은 가만히 있고 마디 지름이 돎 |
| `kepler` | 케플러 | 케플러 방정식 M = E − e sin E 를 뉴턴법으로 풀어 타원 궤도. 제3법칙으로 정한 안쪽 행성과 2:1 공명 |
| `tautochrone` | 등시 곡선 | 사이클로이드 그릇에서 높이가 다른 구슬 넷이 바닥에 동시에 닿음 (하위헌스). 호 길이로 풀면 단진동 |
| `hopf` | 홉프 올뭉치 | S³ 을 원으로 가른 홉프 올 넷을 입체 투영. 서로 꿰인 원들이 돌고, 90도마다 같은 모양 |
| `mobius` | 뫼비우스 띠 | 띠가 한 바퀴 도는 동안 가장자리를 걷는 점은 두 바퀴를 돌아야 제자리 |
| `trefoil` | 삼엽 매듭 | (2,3) 원환 매듭. 120° 대칭(매개변수 4π/3 밀림)을 이용해 구슬 셋이 매듭을 타고 돎 |
| `coupled` | 결합 진자 | 용수철로 이은 진자 둘. 고유 진동 10:12 의 합이라 흔들림이 한쪽에서 다른 쪽으로 넘어갔다 돌아옴(맥놀이) |
| `orbital` | 3d 오비탈 | 수소 3d_z² 확률밀도에서 기각 표집한 점 구름. 위아래 덩어리와 가운데 고리가 돎 |
| `klein` | 클라인 병 | 8자 몰입. 긴 방향 선의 끝이 뒤집혀 처음과 이어지고, 구슬은 두 바퀴를 돌아야 제자리 |
| `brownian` | 브라운 고리 | 크기 1/k 인 푸리에 급수(카르후넨–뢰브)로 만든 닫힌 브라운 경로. 제멋대로 같지만 정확히 반복 |
| `lorenz` | 로렌츠 끌개 | 혼돈 방정식(σ=10, ρ=28, β=8/3)을 RK4 로 적분한 나비 끌개 위를 구슬 셋이 달림. 궤적은 반복하지 않고, 구슬이 사라졌다 돌아오며 이어짐 |
| `tree` | 프랙털 나무 | 가지가 0.68 배 닮은 가지 둘로 갈라지기를 되풀이. 갈래 각이 숨 쉬고 바람이 끝가지를 더 흔듦 |
| `jitterbug` | 지터버그 | 정삼각형 8장이 변 길이를 지키며(a² + b² − ab = 1) 비틀려 육팔면체 → 정이십면체 → 정팔면체 (풀러) |

## 배포

`main` 에 푸시하면 `.github/workflows/pages.yml` 이 갤러리를 GitHub Pages 로 올리고 오른쪽 아래에 `v빌드시각 · 커밋해시` 를 표시한다.

**Pages 는 공개 저장소이거나 유료 플랜(Pro/Team)이어야 켜진다.** 비공개 저장소 + 무료 플랜이면 워크플로가 `configure-pages` 단계에서 `Resource not accessible by integration` 으로 멈추고 사이트가 만들어지지 않는다. 이때는 저장소를 공개로 바꾸거나(Settings → General → Danger Zone → Change visibility), 로컬에서 `npm run dev` / `dev.bat` 으로 본다. 공개로 바꾼 뒤에도 안 되면 Settings → Pages → Source 를 **GitHub Actions** 로 바꾸고 Actions 탭에서 `pages` 워크플로를 다시 실행한다.

갤러리 주소: https://praswna.github.io/dot-loaders/

## 라이선스

MIT. Anthropic 의 원본 스프라이트 PNG 는 포함하지 않으며, `claude-code` 는 관찰한 움직임을 수식으로 다시 쓴 재현이다.
