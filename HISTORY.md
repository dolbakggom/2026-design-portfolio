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
