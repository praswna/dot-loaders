# claude.ai 대기 점 애니메이션(WorkingMark) 조사 노트

2026-10-06 에 claude.ai 웹 번들을 뜯어 확인한 내용. 이 저장소의 `claude-code` 변형은 이 조사를 바탕으로 수식으로 다시 그린 것이다.

## 어디에 있나

- Claude 데스크톱 앱(Electron, `app.asar`)에는 3점짜리 인라인 로더(`.cds-dot`, CSS 키프레임 `cds-dot-pulse`)만 들어 있다. 채팅·Code 탭 UI 자체는 claude.ai 에서 원격으로 불러온다.
- 대기 표시는 React 컴포넌트 `data-cds="WorkingMark"` (내부 이름 *clay mark*). `shared-frame-*.js` 청크에 있다.
- 스프라이트 매니페스트 모듈: `assets-proxy.anthropic.com/claude-ai/v2/assets/v1/c8677db5f-DPCj78Q9.js`
  (`SHEETS`, `SHEET_FRAME = 48`, `SHEET_URLS`, `ALIASES` 를 export). 해시는 배포마다 바뀔 수 있다.

## 구조

- CSS 키프레임이 아니라 **48px 정사각형 프레임을 세로로 쌓은 PNG 스프라이트 시트**. Web Animations API 로 `translateY` 를 `steps(n, jump-none)` 으로 넘긴다. 프레임당 33.33ms(30fps).
- 화면에는 20px 상자로 축소해 그린다. 색은 `--cds-clay` = `#d97757` (강조 `#c6613f`).
- 활동(activity)마다 `in / loop / out` 세 장. 활동이 바뀌면 현재 시트를 `out` 까지 재생한 뒤 다음 시트의 `in` 으로 넘어가고, 레이어를 300ms 크로스페이드한다.
- 정지 요청이 오면 `seams`(이음새 프레임)에서만 `out` 으로 넘어가 동작이 끊기지 않게 한다. 모션 축소 설정이면 `rest` 프레임 한 장만 보여 준다.
- 시트가 아직 안 내려왔으면 지름 7px(20px 상자의 35%) 단색 점을 대신 보여 주고, `grow` 시트로 그 점을 작게 줄인 뒤 `in` 으로 이어 간다.

## 시트 목록

| 활동 | in | loop | out | 모양 |
|---|---|---|---|---|
| sphere / default | 16 | 40 (rest 38) | 14 | 가로 3점, 가운데 점이 커졌다 작아짐 |
| think | 16 | 110 (seams 54, rest 95) | 15 | 3점이 흐트러졌다 모임 |
| **code** | 16 | **75 (seams 18·37·56, rest 74)** | 9 | **2×2 네 점, 대각선 짝 교환** |
| read | 21 | 60 (rest 44) | 19 | 큰 점 + 작은 점들이 궤도를 돎 |
| search | 16 | 20 (rest 4) | 14 | 2점 + 작은 점이 왕복 |
| write | 31 | 60 (rest 36) | 14 | 5점 물결 |
| compose (= quill) | 16 | 62 (rest 49) | 12 | 깃펜 모양 |
| blocked | 16 | 30 (rest 0) | 16 | 이중 원 |
| grow | 10 | | | 큰 점 → 작은 점 |

## code 마크의 움직임

프레임별 좌표 전체: [claude-code-mark-frames.md](./claude-code-mark-frames.md)

- **loop (75프레임, 2.5s)**: 대각선 짝 교환 4회. TL↔BR, TR↔BL, TL↔BR, TR↔BL. 한 교환 약 18.5프레임(0.62s), 쉬는 구간 없음.
- 교환 한 번: 두 점이 중심을 스치듯 지나 **S자 곡선**으로 반대 모서리에 들어간다. TL 점은 중심 왼쪽 아래를 지나 아래 변 바깥으로 2~3px 불룩하게 돌아 BR 로, BR 점은 그 점대칭 경로로 TL 로. 가는 길에 가만히 있는 점과 잠깐 겹친다.
  - 경로를 3차 베지에로 맞추면 (48px 기준) `(12.3,12.3) → (16.3,22.3) → (23.0,45.1) → (35.9,35.9)`, 최대 오차 0.8px.
  - 진행 곡선은 비대칭: 39% 시점에 거리의 48% 를 지난다 (빨리 들어가 천천히 안착).
- **in (16프레임)**: 반지름 3.1px 점이 2프레임 멈춘 뒤 7px 로 부풀고(ease-in), 넷으로 갈라져 모서리로 ease-out. 모서리 중심은 12.3 / 35.9, 반지름 4.5.
- **out (9프레임)**: 넷이 가속하며 중심으로 모여 반지름 6.9 로 합쳐진 뒤 3.1 로 줄어듦.

## 저작권 메모

Anthropic 의 PNG 시트는 이 저장소에 포함하지 않는다. `claude-code` 변형은 관찰한 움직임을 수식으로 다시 쓴 것이고, 나머지 변형은 창작이다.
