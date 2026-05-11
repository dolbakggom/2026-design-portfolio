# HISTORY.md

이 파일은 집/회사 환경과 Codex 세션이 달라도 다음 에이전트가 작업 맥락을 바로 이어받을 수 있도록 남기는 작업 기록입니다. 새 커밋이나 푸시를 만들기 전에는 이 파일에 변경 이유, 구현 방식, 검증 결과를 추가하세요.

## 2026-05-11 Safari scroll, gallery, detail refinement

### 요구사항
- Safari에서 홈 snap scroll이 멈추는 문제를 보강합니다.
- WORK gallery 진입 시 와이드 화면에서 검정 배경이 잠깐 보이는 flash를 제거합니다.
- Gallery filter에 `ALL` 탭을 추가하고 기본값을 `ALL`로 둡니다.
- 작업물 연도 표시는 `<time datetime="YYYY">`를 사용합니다.
- Gallery thumbnail은 background image + `background-size: cover`로 표시합니다.
- Featured work blur 전환 중 배경색이 비치는 현상을 줄입니다.
- Work detail 상단 back link는 `←`만 남기고, 헤드라인 위에 기존 hero/thumbnail 기반 cover 이미지를 추가합니다.
- Work detail cover는 게시글 폭이 아니라 viewport 좌우를 꽉 채우고, 스크롤 중 fixed 배경처럼 유지되다가 본문이 올라오면 흰색으로 점차 페이드되어야 합니다.

### 구현
- `src/components/HomePage.astro`
  - 기존 GSAP Observer를 유지하면서 native `wheel`/`touch` fallback dispatcher를 추가했습니다. Safari에서 Observer가 입력을 놓쳐도 같은 snap 함수로 들어갑니다.
  - Gallery filter를 `ALL`, `UI/UX`, `BI/BX` 순서로 바꾸고 `ALL` 선택 시 모든 work tile을 표시합니다.
  - Featured work 연도는 `<time>`으로 변경했습니다.
  - Gallery thumbnail은 `<img>` 대신 `.work-tile-media`의 CSS background image로 표시합니다.
- `src/styles/global.css`
  - Gallery section은 full-width paper background, 내부 `.gallery-canvas`는 1920px max-width로 분리했습니다.
  - `.work-tile-media`에 cover background sizing을 적용했습니다.
  - Featured panel의 parent `filter: blur()`를 제거하고, `pointer-events: none`인 overlay pseudo-layer에 `backdrop-filter`를 적용했습니다.
  - Work detail cover/back arrow 스타일을 추가했습니다.
  - Detail cover를 `100vw` full-bleed spacer와 fixed image layer로 분리했습니다.
  - Fixed cover에는 아래로 갈수록 흰색이 강해지는 linear gradient와 masked `backdrop-filter` blur layer를 올렸습니다.
  - Scroll progress를 받는 흰색 fade overlay를 추가해 본문이 cover 위로 올라올 때 이미지가 점차 흰색으로 사라지게 했습니다.
- `src/pages/work/[slug].astro`
  - Back link visible text를 `←`로 줄이고 `aria-label="Back to work"`를 유지했습니다.
  - Detail hero 위에 `work.hero ?? work.thumbnail` 기반 cover 영역을 추가했습니다.
  - Cover 이미지 luminance를 canvas로 샘플링해 back arrow 색상을 검정/흰색으로 자동 전환합니다.
  - Cover scroll progress를 requestAnimationFrame 기반으로 CSS variable `--cover-fade`에 반영합니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 dev 서버 `http://127.0.0.1:4322` 기준 `/`, `/work`, `/work/rush-hour-app` 응답 `200 OK`

## 2026-05-07 회사 맥북 작업 요약

### 배포와 저장소 정리
- GitHub 저장소를 `dolbakggom/2026-design-portfolio`로 연결했습니다.
- Cloudflare Worker/Pages 배포 과정에서 기존 프로젝트 이름 흔적이 남아 있던 부분을 `2026-design-portfolio` 중심으로 정리했습니다.
- Cloudflare custom domain은 `dolbakggom.com`으로 설정했습니다.
- `wrangler.toml`의 production route는 custom domain 기반으로 유지합니다.
- 로컬 `.dev.vars` 기준으로 admin username은 `dolbakggom`입니다. 이 값은 non-secret이라 Wrangler vars에 둘 수 있지만, secret 값은 커밋하지 않습니다.

### 홈 스크롤 메커니즘 재작업
요구사항:
- Intro -> About -> Career -> Work intro -> Featured work는 섹션 단위로 이동합니다.
- Career 내부 item은 snap이 아니라 기본 스크롤 위치 기반으로 부드럽게 focus가 바뀌어야 합니다.
- Career 마지막 item 이후에는 바로 Work intro로 snap되어야 합니다.
- Work intro에서 위로 스크롤하면 Career 마지막 item으로 바로 돌아가야 합니다.
- Work gallery부터는 일반 smooth scroll로 풀립니다.
- `/about`, `/career`, `/work`는 직접 진입 alias로만 쓰고, 스크롤 중 URL이 자주 바뀌지 않게 합니다.

구현:
- `src/components/HomePage.astro`에서 GSAP `Observer` + `ScrollToPlugin` 기반 snap 제어를 유지하되, Career 구간에서는 Observer를 비활성화하고 ScrollTrigger progress로 timeline active item을 제어했습니다.
- Career 진행 범위는 `careerStartProgress`, `careerEndProgress`로 조정합니다. 현재 첫 Career point는 다소 늦게 켜지도록 `careerStartProgress`를 뒤로 밀어둔 상태입니다.
- Career/Work 경계는 `wheel` capture handler로 먼저 잡아서 브라우저 기본 스크롤이 Work 중간까지 진행되기 전에 snap되도록 했습니다.
- Snap 이동 시간은 intro-about 체감에 맞춰 `0.74s`로 통일했습니다.
- Gallery 진입 시에만 `/work`를 유지하고, gallery 밖 홈 구간에서는 `/`로 되돌립니다.

### Featured work 전환 방식 변경
요구사항:
- Featured work가 섹션 전체가 아래에서 위로 슬라이드되는 느낌이 아니라, 같은 위치에서 텍스트와 배경이 자연스럽게 전환되어야 합니다.

구현:
- `src/components/HomePage.astro`의 featured 영역을 sticky stage + transparent scroll steps 구조로 변경했습니다.
- 실제 화면은 `.featured-stage` 안의 `[data-featured-panel]` 레이어들이 같은 위치에서 겹쳐 있고, scroll step에 따라 active panel만 바뀝니다.
- `src/styles/global.css`에서 featured panel은 opacity/blur transition으로 교차 전환됩니다.
- 기존 full-bleed image card, overlay text, 자동 black/white contrast 로직은 유지했습니다.

### 주요 파일
- `src/components/HomePage.astro`
  - 홈 경험 전체 구조
  - Intro/About/Career/Work/Featured/Gallery 스크롤 제어
  - Route alias 초기 진입 위치 처리
  - Featured active panel 전환
- `src/styles/global.css`
  - `html.home-scroll` snap/free-scroll 상태 스타일
  - Career timeline card transition
  - Featured sticky stage와 layer crossfade 스타일
- `AGENTS.md`
  - 프로젝트 규칙과 앞으로의 히스토리 갱신 규칙

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 dev 서버 기준 `/`, `/career`, `/work` 응답 `200 OK`

### 참고 상태
- 마지막 확인 당시 로컬 dev 서버는 `http://127.0.0.1:4322/`에서 실행 중이었습니다. 포트는 환경에 따라 달라질 수 있습니다.
- 최신 작업 커밋 기준: `f7ceb73 Refine home scroll and featured transitions`

## 다음 작업 시 주의할 점
- Home snap은 `html.home-scroll` 범위에만 적용되어야 합니다. `/work/*` 상세 페이지와 admin 화면에는 전역 snap이 번지면 안 됩니다.
- Career 구간은 snap target으로 item을 하나씩 만들지 않고, ScrollTrigger progress 기반으로 유지하는 것이 현재 의도입니다.
- Featured work는 실제 panel이 여러 섹션으로 흐르는 구조가 아니라 sticky stage 안 레이어 전환 구조입니다. scroll target은 `.featured-step`이 담당합니다.
- `/work` 직접 진입은 gallery 시작점으로 이동하는 alias 역할입니다. Work intro/featured 구간에서 URL을 `/work`로 강제 유지하지 않는 것이 현재 방향입니다.
- 배포 전에는 `npm run build`와 `git diff --check`를 최소 검증으로 실행하세요.
