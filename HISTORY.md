# HISTORY.md

이 파일은 다음 에이전트와 다른 개발 환경(집/회사 등)에서 작업 맥락을 이어받을 수 있도록 유지하는 최근 작업 히스토리 버퍼입니다. 오래된 기록은 레포 안의 날짜별 아카이브로 옮겨 관리합니다.

## 히스토리 관리 규칙

1. **최근 기록은 `HISTORY.md`에 유지**
   - `HISTORY.md`는 오늘 작업과 바로 이어서 봐야 하는 최신 맥락을 담는 파일입니다.
   - 파일이 너무 길어지면 다음 에이전트가 핵심을 찾기 어려우므로, 날짜가 지난 기록은 `history/YYYY-MM-DD.md`로 옮깁니다.

2. **아카이브는 레포에 포함**
   - `history/` 폴더는 로컬 임시 폴더가 아니라 Git으로 추적되는 공식 작업 기록입니다.
   - `HISTORY.md`에서 기록을 분리했다면 `history/YYYY-MM-DD.md` 파일도 같은 커밋에 포함해야 합니다.
   - 집/회사 맥 어디서든 열려야 하므로 개인 홈 디렉터리 기반 절대 경로 링크는 쓰지 않고, `history/2026-05-20.md` 같은 상대 경로만 사용합니다.

3. **과거 히스토리 조회**
   - 과거의 작업 내역은 [`history/`](history/) 폴더의 날짜별 마크다운 파일을 참고합니다.
   - 예: [`history/2026-05-20.md`](history/2026-05-20.md)

4. **기록 주기**
   - 새로운 동작 변경, 배포 구성 수정, 스키마 변경, 스크롤 메커니즘 변경, 시각 구조 변경, 또는 미래 에이전트가 알아야 할 가정이 변경되었을 때 커밋/푸시 전에 항상 기록을 갱신합니다.
   - 히스토리 엔트리에는 요구사항, 구현 요약, 중요 파일, 검증 명령/결과, 남은 팔로우업 또는 주의사항을 명확히 기록합니다.
   - 커밋 전 `git status --short`로 `history/` 아카이브가 누락되지 않았는지 확인합니다.

## Archive Index

- [`history/2026-05-07.md`](history/2026-05-07.md)
- [`history/2026-05-11.md`](history/2026-05-11.md)
- [`history/2026-05-12.md`](history/2026-05-12.md)
- [`history/2026-05-13.md`](history/2026-05-13.md)
- [`history/2026-05-14.md`](history/2026-05-14.md)
- [`history/2026-05-18.md`](history/2026-05-18.md)
- [`history/2026-05-19.md`](history/2026-05-19.md)
- [`history/2026-05-20.md`](history/2026-05-20.md)
- [`history/2026-05-21.md`](history/2026-05-21.md)

---

## 2026-05-29 Career Timing and Work Reveal Clamp

### 요구사항
- About에서 Career로 넘어가기 전 체류 시간을 절반 수준으로 줄입니다.
- Career point 마지막 항목이 끝나기 전에 Work 섹션이 먼저 올라오는 문제를 막습니다.
- 마지막 Career point 이후 Work가 넘어오기 전 체류는 point 하나 넘어가는 양의 약 두 배 정도만 남깁니다.

### 구현
- `src/components/HomePage.astro`
  - About hold 시작 기준을 `0.18`에서 `0.09`로 줄이고, Career 전환 완료 기준을 `0.38`에서 `0.29`로 앞당겼습니다.
  - Career point 전용 scroll range를 `#work`가 뷰포트 아래에서 올라오기 시작하는 시점(`workTop - panelHeight`) 기준으로 역산하도록 바꿨습니다.
  - 마지막 Career point가 먼저 완료되고, 그 뒤에 point step 두 칸 정도의 여유를 둔 뒤 Work가 올라오도록 `availableBeforeWork * ((count - 1) / (count + 1))` 수식으로 timeline travel을 계산합니다.
  - Career point 클릭 이동도 같은 물리 range를 사용하도록 맞춰 스크롤 진행과 클릭 위치가 어긋나지 않게 했습니다.

### 검증
- `git diff --check` 통과.
- sandbox 내부 `npm run build`는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
- 승인된 환경에서 `npm run build` 재실행 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

## 2026-05-29 Career Timeline Trigger and Profile Filter Fix

### 요구사항
- 데스크톱 profile image 필터를 모바일 career 상태와 같은 값으로 맞춥니다.
- About에서 Career로 넘어갈 때 profile image가 번쩍이는 현상을 다시 방지합니다.
- Career point 스크롤이 세 번째 항목 이후 멈추는 문제를 확실하게 수정합니다.

### 원인
- Career point 진행 계산은 물리 스크롤 기준으로 바꿨지만, 실제 갱신 호출은 About/Career 전환용 ScrollTrigger 안에 남아 있었습니다.
- 해당 전환 트리거는 identity section 전체보다 짧게 끝나므로, 트리거 종료 이후에는 timeline render가 호출되지 않아 세 번째 항목 부근에서 멈출 수 있었습니다.
- Profile image는 GSAP inline `filter` 문자열과 `.is-career` CSS 필터가 동시에 관여해 전환 경계에서 순간적으로 밝아지는 프레임이 생길 수 있었습니다.

### 구현
- `src/components/HomePage.astro`
  - Career point 전용 ScrollTrigger를 별도로 추가했습니다. Start/end는 `getCareerTimelineScrollForProgress(...)`가 계산하는 실제 Career timeline 물리 구간을 사용합니다.
  - About/Career 전환용 ScrollTrigger에서는 Career point render 호출을 제거해 두 스크럽 책임을 분리했습니다.
  - Timeline card progress는 각 카드가 focus window 중앙에 오는 실제 offset 기준으로 캐시하도록 조정했습니다.
  - Profile image는 `filter` 문자열 tween 대신 CSS custom property(`--profile-media-grayscale`, `--profile-media-contrast`, `--profile-media-brightness`, `--profile-media-enter-blur`)를 스크럽합니다.
- `src/styles/global.css`
  - 데스크톱 profile image도 모바일 career 상태와 같은 `grayscale(0.45) contrast(1.12) brightness(0.62) blur(3px)` 결과가 되도록 CSS 변수 기반 filter로 변경했습니다.
  - 검은 dim pseudo-layer는 끄고, 이미지 밝기/대비/블러 필터 중심으로 처리해 About/Career 경계의 번쩍임 리스크를 줄였습니다.
  - 모바일 career blur도 같은 변수 기준으로 맞춰 데스크톱과 결과값이 어긋나지 않도록 했습니다.

### 검증
- `git diff --check` 통과.
- sandbox 내부 `npm run build`는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
- 승인된 환경에서 `npm run build` 재실행 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

## 2026-05-29 Career Dissolve and Work Transition Follow-up

### 요구사항
- Career point 디졸브값을 현재 배포된 값 기준으로 되돌립니다. 모바일도 같은 기준을 따릅니다.
- About 텍스트가 나올 때 프로필 이미지가 늦게 뜨지 않고 처음부터 보이게 합니다.
- Career에서 Work로 넘어갈 때 체류시간을 줄였는데도 오래 걸리는 원인을 분석하고 수정합니다.

### 구현
- `src/components/HomePage.astro`
  - 프로필 이미지를 About intro tween으로 뒤늦게 reveal하지 않고, 초기 상태부터 `autoAlpha: 1`, `filter: blur(0px)`, `scale: 1`로 보이도록 바꿨습니다.
  - Career 전환 중 프로필 이미지 dim/blur는 배포 기준의 어두운 디졸브에 가깝도록 `--profile-career-dim: 0.84`, `grayscale(1) contrast(1.1) blur(2px)`, `scale: 1.04`로 조정했습니다.
  - Career point focus dissolve 곡선을 배포 기준인 `1 / (count - 1) * 1.15` range 계산으로 되돌렸습니다. 카드별 실제 위치 기반 progress 캐시는 유지해 스크럽 위치 오차는 다시 만들지 않았습니다.
  - Career timeline 진행을 `ScrollTrigger self.progress`가 아니라 `getCareerTimelineScrollForProgress(...)` 기반 물리 스크롤 범위로 계산하게 바꿨습니다. 기존에는 `maxTimelineTravel`을 줄여도 일반 스크롤 중에는 반영되지 않아 Work 진입 전 체류가 길게 느껴졌습니다.
- `src/styles/global.css`
  - 모바일 career 상태의 프로필 이미지 필터를 배포 기준인 `grayscale(0.45) contrast(1.12) brightness(0.62)`로 되돌렸습니다.
  - 모바일에서는 데스크톱용 검은 dim pseudo-layer를 끄고, 기존 모바일 필터/그라데이션 기준으로 보이도록 했습니다.

### 검증
- `git diff --check` 통과.
- sandbox 내부 `npm run build`는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
- 승인된 환경에서 `npm run build` 재실행 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

## 2026-05-29 Career Point Scrub Alignment

### 요구사항
- Career point에 들어간 스크러빙이 한 박자 늦게 반응하는 느낌을 줄입니다.
- 스크롤 진행에 맞춰 항목들이 바로 변경되되, 각 항목 내용을 읽을 수 있도록 약간의 체류감을 둡니다.

### 구현
- `src/components/HomePage.astro`
  - Career timeline의 활성 항목 계산을 기존 `index / (count - 1)` 균등 분할 기준에서 실제 카드 중심 위치 기반 progress 캐시로 변경했습니다.
  - 카드별 progress는 scroll 중 매 프레임 계산하지 않고 `updateScrollGeometryCache()`에서만 계산해, 스크롤 중 layout read가 늘어나지 않도록 했습니다.
  - 항목 포커스 weight에 짧은 dwell plateau를 추가해 해당 항목이 즉시 반응하면서도 너무 빠르게 사라지지 않도록 조정했습니다.
  - Career point 클릭 이동도 동일한 카드별 progress 캐시를 사용해, 클릭 위치와 스크럽 포커스 위치가 어긋나지 않게 맞췄습니다.

### 검증
- `git diff --check` 통과.
- sandbox 내부 `npm run build`는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
- 승인된 환경에서 `npm run build` 재실행 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

## 2026-05-28 Career Timeline and Mobile Gallery Polish

### 요구사항
- 커리어 타임라인 포인트 수가 늘어남에 따라 물리 스크롤 계산 범위를 넓혔으나, 마지막 8번째 포인트에 도달하기도 전에 다음 `#work` (Work Intro) 섹션이 아래에서 위로 덮고 올라와 마지막 이력 항목이 가려져 보이지 않는 문제를 해결합니다.
- 모바일 화면에서 페이지 최하단으로 스크롤했을 때, `.gallery-section` 의 끝부분이 뚝 끊기고 뒤쪽 Featured 섹션의 검은색 배경이 노출되는 틈새 비침 현상을 제거합니다.
- Gemini의 GSAP 성능 리뷰를 검토해, 스크롤 중 반복되는 geometry read와 `onUpdate` 직접 style write를 줄입니다.
- 스크롤 경계에서 `history.replaceState`가 단시간에 반복 호출되어 Safari 히스토리 쿼터 예외가 발생할 수 있는 리스크를 줄입니다.
- About 프로필 이미지는 첫 진입 경로에서 빠르게 노출될 수 있으므로 lazy 로딩을 제거합니다.
- 첫 인트로 JS 초기화 간극에서 About/Career 요소가 잠깐 보이며 로고가 번쩍이는 FOUC를 방지합니다.
- About/Career 전환과 career point 이동을 스냅/비동기 타이핑 중심에서 Apple-style scroll scrubbing 방식으로 바꿔, 스크롤 위치에 맞춰 양방향으로 재생되게 합니다.

### 구현
- `src/components/HomePage.astro`
  - `getCareerTimelineScrollForProgress` 함수에서 타임라인 진행률 계산을 위한 최대 스크롤 한계선(`maxTimelineTravel`)을 `#work`가 뷰포트 하단에서 올라오기 시작하는 임계점보다 안전하게 이전으로 끝나도록 수정했습니다.
  - 구체적으로, 전체 높이(`totalHeight`)에서 CSS 패널 높이(`getPanelHeight()`)의 1.3배를 뺀 영역까지만 타임라인이 스크롤 진행률 100%에 도달하도록 계산 범위를 제한했습니다.
  - `identity`, `#work`, `#featured-work`, panel height, sticky stage height의 geometry 값을 캐싱하고 `resize`, `visualViewport`, `ScrollTrigger.refreshInit/refresh` 흐름에서만 갱신하도록 정리했습니다.
  - Featured 섹션 높이 CSS 변수 갱신 이후에도 geometry cache를 다시 갱신해, 캐시 값이 레이아웃 변경 전 높이에 머무르지 않도록 보정했습니다.
  - `career-work` 디졸브와 `featured-gallery` 디졸브의 `onUpdate` 직접 `style.setProperty(...)` 호출을 GSAP `fromTo(..., { scrollTrigger })` scrub tween으로 전환했습니다.
  - 스크롤 트리거에서 발생하는 route 변경은 150ms 디바운스로 묶고, 명시적 클릭/초기 섹션 진입은 즉시 처리할 수 있는 옵션을 추가했습니다. `replaceState` 예외는 `try/catch`로 흡수해 브라우저 쿼터 상황에서도 스크립트가 중단되지 않도록 했습니다.
  - `.profile-media img`의 `loading="lazy"`를 제거해 `/about` 직접 진입 또는 intro 이후 첫 노출 시 브라우저가 프로필 이미지를 미루지 않도록 했습니다.
  - About/Career 본문 타이핑용 `prepareTypeElement`/`typeElement`/`playAboutIntro` 흐름을 제거하고, `identityScrubTimeline`을 `ScrollTrigger` progress에 직접 연결했습니다.
  - About 문단, 프로필 로고/연락처/미디어, Career copy, timeline list가 스크롤 진행률에 따라 reveal/cross-fade 되도록 단일 scrub 타임라인으로 통합했습니다.
  - Career timeline은 active index 스냅 대신 `--timeline-focus-offset`, `--timeline-card-opacity`, `--timeline-card-scale`, `--timeline-detail-opacity`를 scroll progress에서 보간해 트랙과 카드가 연속적으로 움직이도록 바꿨습니다.
  - Timeline offset 계산은 scroll 중 layout read를 피하도록 cached max offset을 사용합니다.
- `src/styles/global.css`
  - `html:not(.intro-complete) .site-shell[data-initial-section="intro"]` 범위에서 `.profile-logo`, `.profile-contact`, `.profile-media`, `.profile-intro`를 숨기고 transition을 끄도록 해, 첫 `/` 진입 인트로가 완료되기 전 About 스테이지 요소가 먼저 페인트되지 않도록 했습니다.
  - `.timeline-track`의 transform transition을 제거하고, `.timeline-card` 및 detail text는 JS가 갱신하는 CSS 변수 기반 opacity/scale/offset으로 렌더링되도록 정리했습니다.
- `src/styles/global.css`
  - `.gallery-section` 의 `min-height`를 기존 고정 `200svh`에서 오버랩 마진 높이와 완벽히 동기화되도록 `calc(2 * var(--home-panel-height))` 로 변경했습니다.
  - 이로 인해 모바일에서 `home-panel-height`가 `100lvh`로 매핑되더라도 오버랩 마진 오프셋과 갤러리 섹션의 최소 높이가 기하학적으로 완벽히 대칭을 이루어, 콘텐츠 개수가 매우 적은 상황(필터 적용 등)에서도 최하단에 검은색 배경이 절대 비치지 않도록 방어했습니다.
  - `prefers-reduced-motion`에서는 `.timeline-track`의 transform을 제거하지 않고 transition만 끄도록 조정해, 모션 감소 환경에서도 focus window 위치 보정은 유지되게 했습니다.

### 검증
- `npm run build` 및 `astro check` 완료 (0 errors / 0 warnings / 0 hints)
- geometry cache / GSAP scrub tween 전환 후에도 `npm run build`, `git diff --check`, 로컬 브라우저 timeline 진행 확인을 다시 수행했습니다.
- route debounce / 프로필 이미지 eager 로딩 반영 후 `npm run build`, `git diff --check`를 재실행했고, 로컬 브라우저에서 `.profile-media img`의 `loading` 속성이 제거된 것과 `/work` 스크롤 진입 시 console error가 없는 것을 확인했습니다.
- About/Career scroll scrubbing 반영 후에도 `npm run build`, `git diff --check`, 로컬 브라우저 스크롤 상태 확인을 다시 수행했습니다.

## 2026-05-27 Career Timeline Focus Window Pass

### 요구사항
- `career point` 개수가 늘어나면서 우측 timeline 목록이 위아래로 잘리는 문제를 개선합니다.
- 우선 스크롤 위치에 따라 point를 강제로 넘기는 GSAP 로직은 제거하고, Lenis smooth scroll은 전체 페이지 스크롤 보정 역할만 남깁니다.
- 이후 섹션별 스크롤 로직을 다시 설계할 수 있도록 career point 동작을 순수 DOM/CSS 중심으로 단순화합니다.
- 배포 사이트에 채운 D1/R2 콘텐츠를 로컬 개발 환경에도 동기화해 실제 8개 career point 기준으로 확인할 수 있게 합니다.

### 구현
- `src/components/HomePage.astro`
  - `timeline-items` 안에 `timeline-track` wrapper를 추가해 바깥 영역은 고정된 focus window, 안쪽 항목 묶음만 이동하는 구조로 변경했습니다.
  - career point 클릭 시 GSAP 강제 snap이 아니라 기존 Lenis `scrollTo` 경로를 통해 해당 point 위치로 이동하도록 복구했습니다.
  - 스크롤 중에는 현재 스크롤 위치를 읽어 `setActiveTimeline(...)`과 focus window offset만 갱신하도록 했습니다.
  - timeline 진행 구간은 기존 ScrollTrigger 내부 range가 아니라 `identity 시작 → work 시작` 실제 물리 스크롤 길이를 기준으로 계산해 8개 point가 너무 빨리 끝까지 넘어가지 않도록 했습니다.
  - resize/viewport refresh 시 현재 활성 point 기준으로 focus offset을 다시 계산합니다.
- `src/styles/global.css`
  - timeline 목록을 `mask-image`가 적용된 고정 높이 focus window로 바꾸고, 위아래 항목이 부드럽게 사라지도록 처리했습니다.
  - 활성 point 주변 항목만 더 선명하게 보이도록 `data-focus-distance` 기반 opacity를 추가했습니다.
  - 모바일 timeline도 같은 focus window 구조를 사용하도록 정리했습니다.
- `scripts/export-d1-via-execute.mjs`
  - Cloudflare D1 export API가 `Authentication error [code: 10000]`로 실패하는 상황을 우회하기 위해 `wrangler d1 execute --remote --json`으로 각 테이블을 읽고 local import SQL을 생성하는 스크립트를 추가했습니다.
- `scripts/sync-r2-assets.mjs`
  - D1 dump의 `assets.r2_key` 기준으로 원격 R2 오브젝트를 로컬 R2에 동기화하는 재사용 스크립트를 추가했습니다.
- D1/R2 local sync
  - `d1-backups/local-before-sync-2026-05-27.sql`로 동기화 전 로컬 D1 백업을 생성했습니다.
  - `d1-backups/remote-prod-2026-05-27.sql`로 원격 D1 데이터를 수동 dump했습니다.
  - 해당 dump를 로컬 D1에 적용했고, R2 30개 오브젝트를 `r2-backups/remote-prod-2026-05-27/`에 내려받아 로컬 R2에도 업로드했습니다.

### 검증
- sandbox 내부 `npm run build`는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
- 승인된 환경에서 `npm run build` 재실행 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- `git diff --check` 통과.
- local D1 row count 확인: `assets 30`, `works 7`, `timeline_items 8`, `work_blocks 0`.
- dev 서버 `http://127.0.0.1:4328/`에서 8개 career point 기준으로 스크롤 시 active point가 `2001.02 → 2023.09 ~ 2026.07`까지 단계적으로 바뀌고 `--timeline-focus-offset`이 갱신되는 것을 확인했습니다.

### 남은 확인
- 실 브라우저에서 career point 진행 속도와 focus window 이동 감도가 원하는지 확인이 필요합니다.
- 이번 변경은 career point 활성/포커스 로직만 단순화한 것이며, intro/about/career/work 섹션 전환 ScrollTrigger 전체 제거는 다음 플랜에서 진행합니다.

## 2026-05-27 PageSpeed LCP Font and Public HTML Cache Pass

### 요구사항
- PageSpeed 모바일 보고서 기준 남은 성능 병목을 줄입니다.
- 전체 Pretendard 정적 폰트 3개 다운로드, 인트로 로고 LCP 이미지 요청, public HTML 비캐시 문제를 우선 처리합니다.

### 구현
- `src/styles/pretendard-dynamic-subset.css`
  - Pretendard 공식 variable dynamic subset CSS를 프로젝트 CSS로 추가하고, font URL을 jsDelivr 절대 경로로 변환했습니다.
  - 프로젝트 weight 규칙에 맞춰 `@font-face` 지원 범위도 `400 700`으로 좁혔습니다.
- `src/styles/global.css`
  - 기존 Regular/Medium/Bold 전체 woff2 직접 선언을 제거하고 dynamic subset CSS import로 변경했습니다.
  - 카테고리 필터 비활성 opacity는 Gemini가 조정한 `0.48` 상태를 유지했습니다.
- `src/components/HomePage.astro`
  - 인트로, about, work intro의 장식용 로고 `<img>`를 inline SVG로 바꿔 외부 이미지 요청을 제거했습니다.
  - 인트로 로고 애니메이션은 opacity 숨김 대신 blur/scale 중심으로 유지해 LCP 노출 지연을 줄였습니다.
  - Gemini가 수정한 featured link `aria-label` 개선을 유지했습니다.
- `src/layouts/BaseLayout.astro`
  - dynamic subset font 요청을 위해 `https://cdn.jsdelivr.net` preconnect를 추가했습니다.
- `src/middleware.ts`
  - `/`, `/about`, `/career`, `/work`, `/work/:slug` public GET HTML만 Cloudflare Cache API 대상이 되도록 middleware를 추가했습니다.
  - `/admin`, `/api/*`, `/media/*`, query string 요청은 캐시 대상에서 제외했습니다.
  - edge TTL은 10분, stale-while-revalidate는 24시간으로 시작했습니다.
- `astro.config.mjs`
  - dynamic subset CSS까지 public stylesheet가 inline될 수 있도록 Vite inline asset limit을 `128 * 1024`로 조정했습니다.
- `docs/superpowers/plans/2026-05-27-pagespeed-lcp-cache.md`
  - Superpowers 기반 실행 계획을 추가했습니다.

### 검증
- sandbox 내부 `npm run build`는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
- 승인된 환경에서 `npm run build` 재실행 통과, `astro check` 0 errors / 0 warnings / 0 hints. 폰트 범위 조정 후에도 같은 명령을 다시 실행해 통과했습니다.
- `git diff --check` 통과.
- `find dist -type f -name '*.css' -maxdepth 5` 결과 CSS asset이 생성되지 않아 dynamic subset CSS까지 inline bundle에 포함된 것을 확인했습니다.
- `rg -n "x-portfolio-cache|cloudflare-cdn-cache-control|cdn-cache-control|cache-control" dist/server src/middleware.ts`로 middleware cache header가 서버 번들에 포함된 것을 확인했습니다.

### 남은 확인
- 배포 후 PageSpeed 재측정에서 font transfer, LCP request discovery, TTFB/HTML cache 항목 변화를 확인해야 합니다.
- CMS 저장 직후 public 페이지 반영은 최대 10분 edge cache TTL 영향을 받을 수 있습니다. 즉시 반영이 필요하면 admin save 후 Cloudflare purge를 별도 작업으로 추가합니다.

## 2026-05-27 Astro v6 Middleware Context Fix

### 요구사항
- dev 서버에서 public HTML cache middleware가 `Astro.locals.runtime.ctx has been removed in Astro v6` 오류를 발생시키는 문제를 수정합니다.

### 구현
- `src/middleware.ts`
  - Astro v6에서 제거된 `context.locals.runtime.ctx` 접근을 완전히 제거했습니다.
  - Cloudflare background cache write는 `context.locals.cfContext.waitUntil(...)`를 사용하도록 변경했습니다.

### 검증
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- `git diff --check` 통과.
- `rg -n "runtime\.ctx|locals\.runtime" src` 결과 없음.
- 임시 dev 서버 `http://127.0.0.1:4327/`에서 `GET /` 요청이 200 OK로 응답하고 `x-portfolio-cache: MISS`, `cloudflare-cdn-cache-control` 헤더가 붙는 것을 확인했습니다.

## 2026-05-27 CSS Render Blocking Inline Threshold

### 요구사항
- PageSpeed 모바일 리포트에서 `/_astro/BaseLayout...css` 7.4KiB 파일이 렌더링 차단 요청으로 잡히는 문제를 줄입니다.
- 권장안인 Astro `inlineStylesheets: "auto"` 유지 + Vite inline asset 한도 상향 방식을 적용합니다.

### 구현
- `astro.config.mjs`
  - `build.inlineStylesheets: "auto"`를 명시했습니다.
  - `vite.build.assetsInlineLimit`를 `32 * 1024`로 설정해 gzip 전송 크기 7.4KiB, 원본 크기 약 28.6KiB인 public CSS가 인라인 대상에 들어가도록 했습니다.

### 검증
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- `find dist -type f -name '*.css'` 결과 CSS asset이 생성되지 않아 public/admin CSS가 인라인된 것을 확인했습니다.
- `rg "BaseLayout.*css|rel=\"stylesheet\"" dist`에서 public CSS 외부 stylesheet 링크가 사라진 것을 확인했습니다. React runtime 내부 문자열은 bundle 코드로 남을 수 있습니다.

## 2026-05-27 PageSpeed Audit and Accessibility Fix

### 요구사항
- Google PageSpeed Insights (모바일) 분석 결과에 따라 지적된 LCP 이미지 지연, 텍스트-배경 명도 대비(contrast ratio), 스크린 리더용 레이블 미스매치(label mismatch) 결함을 개선합니다.

### 구현
- `src/components/HomePage.astro`
  - 인트로 섹션의 메인 로고 이미지(`.site-logo.intro-logo`)에 `fetchpriority="high"` 속성을 추가하여 최우선 순위로 빠르게 로딩되도록 최적화했습니다. (LCP 단축)
  - Selected Work 목록의 "더 알아보기" 링크(`a.featured-more`)에서 `aria-label` 값에 가시적인 텍스트인 `"더 알아보기"`를 명시적으로 포함하여 `label-content-name-mismatch` 경고를 완벽히 해결했습니다.
- `src/styles/global.css`
  - 카테고리 필터 비활성 버튼의 opacity를 기존 `0.32`에서 `0.48`로 조정해 텍스트 가독성을 높이고, 배경 대비 명도 대비율을 Lighthouse 합격 기준인 `3:1` 이상으로 확보했습니다. (Accessibility 스코어 향상)

### 검증
- `npm run build` 및 `astro check` 완료 (0 errors / 0 warnings / 0 hints)
- 임시 분석용 로컬 lighthouse report 리소스 정리 완료

## 2026-05-27 Home Scroll Performance Pass

### 요구사항
- Chrome PageSpeed 리포트에서 남은 forced reflow/ScrollTrigger 관련 문제를 확인하고 홈 스크롤 로직을 더 안정적으로 최적화합니다.
- Career point 클릭 시 해당 point 위치로 정확히 이동하지 않고 버벅이는 문제를 수정합니다.

### 원인
- PageSpeed 모바일 리포트 기준 폰트 CSS 차단은 줄었지만 `ScrollTrigger` JS, 초기 inline 측정, forced reflow가 남아 있었습니다.
- 홈 스크롤 `onUpdate`에서 identity mode, career list, timeline active, featured active class/tween을 매 프레임 반복 실행하고 있었습니다.
- Career point 클릭 target 계산이 실제 ScrollTrigger `start/end` 범위가 아니라 별도 추정 range를 사용해서, 세 번째 point 클릭 후 다섯 번째 point가 active 되는 식의 위치 오차가 발생했습니다.

### 구현
- `src/components/HomePage.astro`
  - identity mode, career list visibility, active timeline index, active featured index를 캐싱해 같은 상태에서는 DOM class/tween을 다시 쓰지 않도록 변경했습니다.
  - main identity ScrollTrigger를 `identityProgressTrigger`로 보관하고 career point scroll target을 실제 `start/end` 기준으로 계산하게 바꿨습니다.
  - `scrollToPosition`에 `onComplete`를 추가해 Lenis 이동 완료 후 career point 상태와 ScrollTrigger를 한 번 더 동기화합니다.
  - Gallery filter clone은 `left/top` 배치 대신 `x/y` transform으로 배치/퇴장하도록 변경했습니다.
- `src/layouts/PublicLayout.astro`
  - floating top button visibility 측정을 즉시 실행하지 않고 `requestAnimationFrame`으로 지연/스로틀하며, 표시 상태가 바뀔 때만 class를 토글합니다.
- `src/styles/global.css`
  - timeline point marker의 `left/width/height` 전환을 transform scale 전환으로 바꿨습니다.
  - 실제 transform/opacity 애니메이션이 걸리는 요소에 한정해 `will-change`를 추가했습니다.
- `docs/superpowers/plans/2026-05-27-home-scroll-performance.md`
  - Superpowers 기반 실행 계획을 추가했습니다.

### 검증
- `git diff --check` 통과.
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- Chrome local `http://127.0.0.1:4323/`에서 career 세 번째 point 클릭 후 active index가 `2`로 유지됨을 확인했습니다.
- Chrome local에서 마지막 career point 클릭 후 active index가 `4`로 유지됨을 확인했습니다.
- Chrome local에서 about 방향으로 되돌릴 때 career list opacity/visibility가 정상적으로 숨겨지는지 확인했습니다.
- 남은 follow-up: 사용자가 배포 후 PageSpeed를 다시 실행해 forced reflow 및 ScrollTrigger unused JS 항목 변화를 확인합니다. ScrollTrigger 청크 자체가 계속 지적되면 home script lazy timing 또는 intro LCP 지연을 별도 pass로 검토합니다.

## 2026-05-27 PageSpeed First Pass

### 요구사항
- Chrome에서 확인한 PageSpeed Insights 모바일 리포트 기준으로 명확한 성능/접근성 문제를 1차 개선합니다.
- 사용자가 직접 푸시 후 PageSpeed를 다시 실행할 예정이므로, 기능/스크롤 구조 변경 없이 안전한 항목부터 처리합니다.

### 구현
- `src/styles/global.css`
  - 렌더링 차단 요청으로 잡힌 외부 Pretendard CSS `@import`를 제거했습니다.
  - Pretendard 400/500/700 weight만 first-party CSS의 `@font-face`로 직접 선언하고 `font-display: swap`을 적용했습니다.
  - timeline card가 native button으로 바뀌어도 기존 시각 스타일을 유지하도록 기본 button border/background/padding/appearance를 초기화했습니다.
- `src/components/HomePage.astro`
  - Gallery category filter를 `tablist` 구조에 맞게 `role="tab"`, `aria-selected`, `aria-controls`, `tabpanel`로 정리했습니다.
  - Career timeline item을 `article role="button"` 대신 native `button`으로 변경하고 custom keydown handler를 제거했습니다.
  - Gallery card thumbnail은 인접 제목/링크 label과 중복 읽힘을 줄이기 위해 decorative image(`alt=""`)로 변경했습니다.
- `docs/superpowers/plans/2026-05-27-pagespeed-first-pass.md`
  - 이번 최적화 계획과 검증 범위를 문서화했습니다.

### 검증
- `git diff --check` 통과.
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- 남은 follow-up: 배포 후 PageSpeed 재측정으로 FCP/LCP 변화 확인. 이후에도 점수가 낮으면 ScrollTrigger 청크 지연 로딩, intro typing LCP 지연, Cloudflare RUM beacon/caching을 별도 pass로 검토합니다.

## 2026-05-26 Mobile Home Viewport Fallback Refinement

### 요구사항
- 모바일 홈 full-size viewport 대응에서 CSS `100lvh`와 JS inline viewport 값이 서로 덮어쓰는 구조를 정리합니다.

### 구현
- `src/components/HomePage.astro`
  - 브라우저가 `100lvh`를 지원하면 CSS large viewport unit을 그대로 사용하고, JS는 `--home-viewport-height` inline 값을 주입하지 않도록 변경했습니다.
  - `100lvh` 미지원 환경에서만 `window.innerHeight`를 fallback px 값으로 `--home-viewport-height`에 주입합니다.
  - 기존 Lenis/featured height/ScrollTrigger refresh 동기화 흐름은 유지했습니다.

### 검증
- `git diff --check` 통과.
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.

## 2026-05-26 Mobile Safari Full-size Viewport Height Adjustment

### 요구사항
- 모바일 Safari에서 하단 주소창이 떠 있을 때 뷰포트 높이가 줄어들며 찌그러지는 현상을 막고, 주소창 뒤쪽 영역까지 꽉 차는 풀스크린(Full-size) 레이아웃으로 렌더링되도록 수정합니다. (상단 영역은 필요시 잘려도 무방함)

### 구현
- `src/components/HomePage.astro`
  - `getVisualViewportHeight` 함수가 `window.visualViewport?.height` (주소창 제외 가용 영역) 대신 `window.innerHeight` (주소창을 포함한 전체 뷰포트 영역)를 반환하게 변경했습니다.
- `src/styles/global.css`
  - 모바일 뷰포트 높이를 결정하는 `--home-viewport-height` 변수를 주소창 높이에 맞춰 실시간으로 줄어드는 `100svh`/`100dvh` 대신 주소창을 가리며 꽉 채우는 `100vh` 및 `100lvh` (Large Viewport)를 적용하도록 수정했습니다.

### 검증
- `npm run build` 및 `astro check` 완료 (0 errors / 0 warnings / 0 hints)

## 2026-05-26 Mobile Home Dynamic Viewport Height

### 요구사항
- 모바일 detail 페이지처럼 메인 홈도 주소창/상단바 변화 후 실제 보이는 viewport 높이를 꽉 채우도록 조정합니다.
- 모바일 featured/detail 폰트 하한값도 함께 낮춰 작은 화면에서 과하게 커 보이지 않게 합니다.

### 구현
- `src/styles/global.css`
  - 홈 패널 높이 계산을 `--home-min-panel-height`와 `--home-viewport-height`로 분리했습니다.
  - 모바일 홈(`html.home-scroll`, `max-width: 1180px`)에서는 고정 최소 높이 `620px`을 풀고 `100dvh` 또는 JS가 주입한 실제 viewport px 값을 따르게 했습니다.
  - Featured category/title/meta/more와 work detail kicker/title/meta 폰트 하한값을 모바일 기준으로 낮췄습니다.
- `src/components/HomePage.astro`
  - `window.visualViewport.height`를 `--home-viewport-height` CSS 변수로 동기화합니다.
  - `visualViewport.resize/scroll`, `resize`, `orientationchange`에서 Lenis 크기와 featured scroll height를 갱신합니다.
  - ScrollTrigger는 즉시 `update()`하고, 실제 `refresh()`는 180ms debounce로 한 번만 실행해 모바일 주소창 변화 중 스크롤 튐을 줄입니다.

### 검증
- `git diff --check` 통과.
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- 실기기 모바일 Safari/Chrome의 주소창 접힘/펼침 체감 검증은 사용자 확인 예정입니다.

## 2026-05-22 Cloudflare npm ci Lockfile Fix

### 요구사항
- Cloudflare Workers build에서 `npm clean-install` 단계가 `package.json`과 `package-lock.json` 불일치로 실패하는 문제를 해결합니다.
- 로그상 누락된 dependency는 `@floating-ui/dom@1.7.6`이며, 앱 빌드 이전 설치 단계에서 중단되었습니다.

### 구현
- `package.json`
  - Tiptap floating menu 계열 peer dependency로 요구되는 `@floating-ui/dom`을 명시 dependency로 추가했습니다.
- `package-lock.json`
  - `node_modules/@floating-ui/dom` 항목을 lockfile에 반영해 Cloudflare의 `npm ci` 기준과 맞췄습니다.

### 검증
- `npm ci --progress=false` 통과.
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints.
- 참고: sandbox 안의 `npm ci`는 npm 자체 오류(`Exit handler never called`)로 실패했지만, 일반 권한에서 같은 명령은 정상 통과했습니다.

## 2026-05-22 Work Detail Topbar Height Update

### 요구사항
- 작업 상세(work detail) 화면의 상단 바(`.work-detail-topbar`) 높이를 기존 92px에서 80px로 변경합니다.

### 구현
- `src/styles/global.css`
  - `.work-detail-topbar` 클래스의 `height` 속성을 기존 `92px`에서 `80px`로 수정했습니다.

### 검증
- `npm run build` 및 `astro check` 테스트 통과 완료.

## 2026-05-22 About Section Intro Animation Timing Update

### 요구사항
- About 섹션의 타이핑 텍스트 및 프로필 사진 애니메이션(`playAboutIntro`)이 재생되기 시작하는 시점이, 페이지가 꽉 찼을 때(`top top`)가 아니라 아래에서 위로 덮어 올라오는 도중에 먼저 시작될 수 있도록 타이밍을 일찍 당겨줍니다.

### 구현
- `src/components/HomePage.astro`
  - `playAboutIntro`를 트리거하는 이벤트를 메인 scrub ScrollTrigger의 `onEnter` / `onEnterBack`에서 제거하고, 별도의 가벼운 ScrollTrigger로 분리했습니다.
  - 분리된 ScrollTrigger의 `start`를 `"top 65%"`로 지정하여, About 섹션이 뷰포트 하단에서 위로 약 35%가량 덮어 올라왔을 때 인트로 애니메이션이 매끄럽게 먼저 시작되도록 개선했습니다.

### 검증
- `npm run build` 및 `astro check` 테스트 정상 작동 완료.

## 2026-05-22 Scroll Cover and Dissolve Transition Update

### 요구사항
- 강제 스냅이 제거되고 Lenis smooth scroll이 활성화된 상태에서, Work Intro 섹션 (`#work`) 및 Work Gallery 섹션 (`.gallery-section`)이 스크롤되어 들어올 때 이전 섹션 위로 자연스럽게 덮어씌워지는(Cover) 슬라이드 트랜지션 효과를 구현합니다.
- 이때 이전 섹션(Identity stage, Featured stage)은 스크롤 진행도에 맞춰 어둡게 디졸브(dim/fade out to black)되도록 처리합니다.
- 늘어난 높이 구조에서도 Career 타임라인 및 Featured 패널 클릭 시 해당 위치로 자연스럽게 이동하도록 오프셋 왜곡을 방지합니다.
- Featured-to-Gallery의 전환 스크롤 거리를 피처드 카드 1개 노출 영역(100vh)과 동일하게 맞추고, 최하단 스크롤 시 이전 검정색 배경이 비치는 현상을 차단합니다.

### 구현
- `src/components/HomePage.astro`
  - `.identity-section` 높이를 결정하는 `identityTravelSvh` 및 `mobileIdentityTravelSvh`에 각각 `100`을 추가로 더해주어, `#work`가 위로 덮어 올라오는 동안 `.identity-stage`가 계속 화면 상단에 `sticky` 고정 상태를 유지하게 했습니다.
  - `identity` ScrollTrigger의 `end` 범위를 `bottom-=${window.innerHeight * 3}px bottom`으로 설정하여, 늘어난 100vh 이전 영역에서만 Career 타임라인 애니메이션이 온전히 진행되도록 타이밍을 조정했습니다.
  - `syncFeaturedScrollHeight()`에서 `.featured-section` 높이 계산 시 피처드 카드가 다 끝난 즉시 대기 없이 갤러리가 덮어 올라오도록 추가 높이를 기존 `* 3`에서 `* 2`로 최적화했습니다.
  - `featuredSection` ScrollTrigger의 `end` 범위를 `bottom-=${getPanelHeight() * 2}px bottom`으로 보정하여, 마지막 카드 활성화가 매듭지어지는 순간에 맞추어 갤러리가 즉각 올라오기 시작하고 100vh의 순수한 슬라이딩 오버랩을 유지하도록 설계했습니다.
- `src/styles/global.css`
  - `.work-intro-section`을 `sticky`에서 `relative`로 변경하여 아래에서 위로 자연스럽게 올라오는 트랜지션 모션을 연출했습니다.
  - `.work-intro-section`과 `.gallery-section` 모두 음수 마진을 기존 `-1 * var(--home-panel-height)`에서 `-2 * var(--home-panel-height)`로 2배 확장하여 100svh 크기의 Cover 중첩(Overlap) 구간을 제공했습니다.
  - `.gallery-section`의 `min-height`를 기존 `100svh`에서 `200svh`로 상향 조정하여, 갤러리 콘텐츠가 적어 offsetTop이 짧아지더라도 최하단 스크롤 시 뒤쪽에 깔려 있는 검정색 `.featured-section`의 바닥 영역이 비치거나 노출되는 현상을 완벽히 격리시켰습니다.

### 검증
- `npm run build` 및 `astro check` 검증 완료 (0 errors / 0 warnings / 0 hints)
- 로컬 smooth scroll 스크롤링 테스트:
  - Career 스크롤 완료 후, `#work`가 올라오면서 고정된 Career 화면 위를 매끄럽게 덮으며 어두운 디졸브가 동시에 이뤄지는 것을 확인.
  - Featured 스크롤 완료 후, `.gallery-section`이 올라오면서 고정된 Featured 화면 위를 덮으며 디졸브가 일어나는 것을 확인.
  - 타임라인 카드나 패널 dot 클릭 시 튀는 현상 없이 지정된 섹션 위치로 부드럽게 스크롤 이동 및 활성화가 정상 처리되는 것을 확인.

## 2026-05-22 Home scroll rebuild to progress-driven sticky sections

### 요구사항
- 홈페이지의 이전 강제 스냅/입력 차단 레거시 코드를 제거하고, 현재 섹션 전환의 시각적 느낌은 유지하되 스크롤 진행률에 맞춰 동작하게 재구성합니다.
- 사이트 전체 smooth scroll은 유지합니다.
- intro-about-career-work는 기존처럼 sticky 체류와 덮이는 전환 느낌을 유지하되, 휠/터치 이벤트 발생 시 자동 이동하지 않게 합니다.
- WORK featured에서 gallery로 넘어갈 때 gallery가 featured 위로 덮이는 구조와 어두운 dissolve를 유지합니다.
- 후속 요청에 따라 work detail은 배포/커밋 기준의 기존 cover blur/fade/fixed 구조로 되돌립니다.
- Chrome/WebKit과 모바일에서 입력을 가로채지 않는 구조를 우선합니다.

### 구현
- `docs/superpowers/plans/2026-05-22-scroll-rebuild.md`
  - Superpowers planning 흐름으로 이번 스크롤 리빌드 범위와 제거 대상/검증 항목을 문서화했습니다.
- `src/components/HomePage.astro`
  - `ScrollToPlugin`, `ScrollTrigger.observe`, wheel/touch/key 입력 차단, snap target 모델, lock/gate 상태, clone cover layer 기반 전환 코드를 제거했습니다.
  - 홈 스크롤은 실제 문서 스크롤과 sticky section을 기본으로 두고, `ScrollTrigger`는 identity/career/featured/gallery의 진행률 상태만 갱신하도록 정리했습니다.
  - Lenis가 있을 때 career point, featured dot, top button, route alias 초기 이동이 같은 scroll controller를 쓰도록 helper를 정리했습니다.
  - work intro 진입 구간에서 career stage의 어두운 dissolve가 scroll progress로 갱신되도록 `#work` trigger를 추가했습니다.
  - featured 진행은 `.featured-section`의 실제 높이를 JS에서 viewport panel 수만큼 계산해 주고, `ScrollTrigger` progress로 active featured work와 dot 상태를 갱신합니다.
  - featured dot click and career point click은 사용자 직접 조작으로만 위치 이동하도록 남겼고, 일반 wheel/touch 입력은 더 이상 가로채지 않습니다.
- `src/layouts/PublicLayout.astro`
  - Public route 전역 smooth scroll을 위해 Lenis를 추가했습니다.
  - Lenis scroll event와 GSAP `ScrollTrigger.update()`를 연결해 sticky/progress trigger가 부드러운 스크롤 중에도 동기화되도록 했습니다.
- `src/styles/global.css`
  - `snap-*` 이름의 panel 변수를 `--home-viewport-height`/`--home-panel-height`로 바꾸고, `.snap-panel`, clone cover, fake featured step CSS를 제거했습니다.
  - intro/about, career/work, featured/gallery가 실제 sticky stacking으로 덮이는 구조가 되도록 section z-index와 sticky/relative layering을 정리했습니다.
  - work intro는 sticky panel로 바꾸고, career/work 및 featured/gallery 진입 dissolve는 각각 CSS 변수 기반 overlay로 적용했습니다.
  - Lenis 권장 CSS class(`html.lenis`, `html.lenis-smooth`)를 추가해 native `scroll-behavior`와 충돌하지 않게 했습니다.
- `src/pages/work/[slug].astro`
  - 직전 detail slide 실험 변경은 되돌렸고, 배포/커밋 기준의 fixed cover + fade 구조를 유지했습니다.

### 남은 주의점
- 이번 변경은 기존 “한 번 굴리면 한 섹션 자동 이동” UX를 의도적으로 제거한 리빌드입니다. 실기기에서 체류 길이와 진행 감각은 사용자가 직접 확인 후 미세 조정할 예정입니다.
- route alias `/work`는 직접 진입 시 gallery로 이동하는 기존 동작을 유지하되, featured 구간 자체는 강제로 `/work` path를 유지하지 않도록 단순화했습니다.
- Work detail은 이번 홈 스크롤 리빌드 범위에서 제외하고 배포 기준으로 유지합니다.

### 검증
- `git diff --check` 통과
- `npm run build`
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서 `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete 확인했습니다.

## 2026-05-28 About/Career Hybrid Scroll Animation Update

### 요구사항
- 우측 Career 타임라인은 자석처럼 미끄러지는 1:1 스크러빙을 유지합니다.
- About 소개글 등장, About/Career 카피 전환, 프로필 미디어/연락처 등장 등은 스크롤 속도에 직접 묶지 않고 자연스럽게 한 번 재생되는 이벤트 애니메이션으로 처리합니다.
- 기존 all-scrub 방식에서 텍스트와 미디어가 스크롤 진행률을 그대로 따라가며 어색하게 움직이던 느낌을 줄입니다.

### 구현
- `src/components/HomePage.astro`
  - `textCopies`, `prepareTypeElement`, `typeElement`, `fillTypeElement`를 복원해 About/Career 카피 타이핑 효과를 다시 이벤트 기반으로 처리했습니다.
  - `identityScrubTimeline`과 `identityScrubTimeline.progress(self.progress)` 바인딩을 제거했습니다.
  - `playAboutIntro()`를 별도 `ScrollTrigger`(`start: "top 65%"`)로 분리해 About 섹션이 올라오는 도중 한 번만 프로필 로고, 미디어, 연락처, About 카피 타이핑을 재생하도록 했습니다.
  - `setIdentityMode()`를 GSAP one-shot timeline 방식으로 바꿔 About -> Career, Career -> About 전환 시 카피/연락처/프로필 미디어가 cross-fade, slide, blur로 자연스럽게 교체되도록 했습니다.
  - `syncCareerTimelineProgress()`는 유지해 타임라인 트랙 위치, 카드 opacity/scale/details가 계속 scroll progress와 1:1로 보간되도록 했습니다.
  - 모바일의 Career copy -> Career list 2단계 구조를 유지하기 위해 `setCareerListStage()`에서 timeline list 노출만 별도 이벤트 tween으로 제어했습니다.
- `src/styles/global.css`
  - 첫 인트로 완료 전 career copy도 FOUC guard 대상에 포함했습니다.
  - GSAP가 직접 제어하는 identity copy/contact/media/timeline list의 CSS transition을 홈 스크롤 범위에서 꺼서 inline tween과 CSS transition이 동시에 걸리지 않게 했습니다.

### 검증
- `git diff --check` 통과.
- `npm run build`
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서 `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete 확인했습니다.
- 로컬 dev 서버 `http://127.0.0.1:4321/` 정상 기동 확인.

### 남은 주의점
- 현재 세션에는 Playwright 패키지가 없어 브라우저 자동 DOM 검증은 수행하지 못했습니다. 사용자가 실제 Chrome/Safari에서 About 등장 시점, Career 전환 경계, 모바일 Career list 진입감을 확인한 뒤 타이밍을 미세 조정하면 됩니다.

## 2026-05-28 About/Career Transition Timing Tuning

### 요구사항
- About에서 Career로 넘어가는 이벤트 애니메이션이 너무 늦게 시작되어 흐름이 끊겨 보이므로 더 자연스럽게 앞당깁니다.
- Career point가 끝난 뒤 Work로 넘어가기 전 일부러 오래 머무는 느낌을 줄입니다.

### 구현
- `src/components/HomePage.astro`
  - Career 모드 진입 기준을 `careerStartProgress`보다 앞쪽으로 분리하고, 복귀 기준은 더 낮게 둔 hysteresis 방식으로 바꿨습니다. 경계 부근에서 위아래로 스크롤할 때 About/Career 전환이 반복적으로 튀는 것을 줄이기 위한 처리입니다.
  - Career timeline 종료 progress를 `0.92`에서 `0.97`로 늦춰 마지막 포인트가 Work 진입 직전까지 더 자연스럽게 이어지도록 했습니다.
  - 클릭/직접 이동 계산에 쓰는 timeline travel 여유를 `1.3 panel`에서 `0.9 panel`로 줄여 마지막 포인트 이후 남는 체류 구간을 완화했습니다.
  - 모바일 Career list 진입 기준도 새 종료 progress에 맞춰 조금 앞당겨졌습니다.

### 검증
- `git diff --check` 통과.

## 2026-05-28 About/Career Scrubbed Transition Update

### 요구사항
- About에서 Career로 넘어가는 부분도 스크롤 진행률에 맞춘 scrubbing 전환으로 바꿉니다.
- About 마지막에는 아주 짧게 체류하는 구간을 둔 뒤 Career로 넘어가게 합니다.
- Career 카피, 프로필 이미지 dim/blur, 연락처 퇴장, 타임라인 리스트 등장까지 Career 전체가 하나의 스크럽 흐름으로 이어지게 합니다.
- About 첫 등장 타이핑은 기존처럼 1회성 이벤트 애니메이션으로 유지합니다.

### 구현
- `src/components/HomePage.astro`
  - 기존 `setIdentityMode()` 내부의 one-shot About/Career 전환 tween을 제거했습니다.
  - `identityTransitionTimeline`을 새로 만들고, `aboutHoldEndProgress = 0.24`부터 `careerStartProgress = 0.38`까지의 진행률에 수동 연결했습니다.
  - 전환 scrub timeline 안에서 About copy/contact/profile media가 빠지고, Career copy/list가 들어오도록 구성했습니다.
  - Career copy는 타이핑과 scrub이 충돌하지 않도록 미리 채워둔 뒤 opacity/blur/translate로만 전환합니다.
  - About 타이핑 도중 사용자가 빠르게 Career 전환 구간으로 진입할 경우, 남은 타이핑 timer가 중복 문자를 만들지 않도록 type run id를 추가하고 `fillTypeElement(aboutCopy)`로 안전하게 마무리합니다.
  - Career point 자체의 1:1 스크러빙(`syncCareerTimelineProgress`)은 그대로 유지했습니다.
- `src/styles/global.css`
  - `.identity-section.is-career .profile-contact`, `.identity-section.is-career .profile-media`의 `opacity: !important`를 제거해 GSAP scrub timeline의 inline opacity가 정상 반영되도록 했습니다.

### 검증
- `git diff --check` 통과.
- `npm run build` 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.
- 로컬에서는 기존 dev server가 `http://127.0.0.1:4321/`에서 이미 실행 중인 상태를 확인했습니다.

## 2026-05-28 About/Career Scrub Timing and Profile Dim Tuning

### 요구사항
- About 마지막 체류 시간을 더 줄입니다.
- Career로 넘어갈 때 프로필 이미지가 흰색 오버레이처럼 덮이는 느낌을 제거하고, 기존처럼 검은 dim과 blur 중심으로 처리합니다.
- 프로필 이미지 디졸브가 너무 어둡게 보이지 않도록 dim 값을 낮춥니다.
- Career 마지막 포인트 이후 Work로 넘어가기 전 체류 시간을 약 2/3 줄입니다.

### 구현
- `src/components/HomePage.astro`
  - About 체류 종료 기준을 `0.24`에서 `0.18`로 앞당겨 Career scrub 전환이 더 빨리 시작되도록 했습니다.
  - 프로필 이미지 전환에서 `autoAlpha: 0.16` 페이드아웃을 제거하고, 이미지 자체는 `autoAlpha: 1`로 유지한 상태에서 `--profile-career-dim` 검은 overlay와 blur만 스크럽하도록 바꿨습니다.
  - Career 마지막 포인트 이후 남는 물리 여유를 `0.9 panel`에서 `0.3 panel`로 줄였습니다.
- `src/styles/global.css`
  - `.profile-media::before`를 추가해 `--profile-career-dim` 기반 검은 overlay를 이미지 위에 얹도록 했습니다.
  - `.profile-media img`, `::before`, `::after`, `figcaption`의 레이어 순서를 명확히 정리했습니다.
  - 모바일 career 상태의 프로필 이미지 필터를 기존보다 덜 어둡게 조정했습니다.

### 검증
- `git diff --check` 통과.

## 2026-06-08 OG and Social Meta Setup

### 요구사항
- 포트폴리오 공유 시 사용할 OG 이미지와 기본 메타 태그를 알맞게 설정합니다.
- 작업물 상세 페이지는 각 작업물의 제목, 요약, 대표 이미지를 공유 메타에 반영합니다.

### 구현
- `astro.config.mjs`
  - production canonical/absolute OG URL 계산을 위해 `site: "https://dolbakggom.com"`을 추가했습니다.
- `src/layouts/BaseLayout.astro`
  - canonical, description, Open Graph, Twitter card, author 메타를 공용 레이아웃에서 출력하도록 확장했습니다.
  - `image`, `imageAlt`, `type`, `noindex` props를 추가해 페이지별 공유 이미지와 색인 정책을 제어할 수 있게 했습니다.
- `src/layouts/PublicLayout.astro`
  - 새 SEO props를 `BaseLayout`으로 전달하도록 타입을 확장했습니다.
- `src/pages/work/[slug].astro`
  - 작업물 상세 페이지의 summary를 description으로 사용하고, 현재 상세 cover 이미지 또는 기본 OG 이미지를 공유 이미지로 사용하도록 연결했습니다.
  - 존재하지 않는 작업물은 `noindex`를 적용합니다.
- `src/pages/admin.astro`
  - 관리자 페이지에 `noindex, nofollow`를 적용했습니다.
- `public/og-image.svg`
  - 기본 공유 이미지로 사용할 1200x630 SVG OG 이미지를 추가했습니다.

### 검증
- `git diff --check` 통과.
- `npm run build`
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서 `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete 확인했습니다.

### 남은 주의점
- 기본 OG 이미지는 SVG입니다. 주요 공유 플랫폼은 일반적으로 PNG/JPG 지원이 더 안정적이므로, 실제 공유 미리보기에서 SVG가 제한되는 서비스가 있으면 같은 경로를 PNG로 교체하거나 `BaseLayout` 기본값만 PNG 경로로 바꾸면 됩니다.
