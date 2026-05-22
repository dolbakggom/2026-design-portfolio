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

---

## 2026-05-21 Home snap input gate

### 요구사항
- 홈 스냅 애니메이션이 실행되는 동안 추가 wheel/touch/key 스크롤 입력을 예약하지 않고 완전히 무시합니다.
- 기존처럼 입력을 처리하다가 부분적으로 막고 보정하는 구조가 화면 흔들림을 만들 수 있으므로, GSAP 스냅 중에는 입력이 상태 머신으로 내려가지 않게 합니다.
- gallery 일반 스크롤, detail/admin 일반 페이지 동작은 건드리지 않습니다.

### 구현
- `src/components/HomePage.astro`
  - `snapInputGateActive` 중심의 중앙 입력 gate를 추가했습니다.
  - `snapToTarget()` 시작 시 gate를 켜고, `wheel`, `touchmove`, `keydown` 이벤트를 capture 단계에서 `preventDefault()`/`stopImmediatePropagation()`으로 차단합니다.
  - gate가 켜져 있는 동안 `ScrollTrigger.observe`도 비활성화해 GSAP Observer와 native fallback이 같은 입력을 중복 처리하지 않게 했습니다.
  - GSAP 스냅 완료 후 `180ms` quiet window가 끝나야 gate가 풀리며, quiet window 동안 들어오는 추가 입력은 모두 버리고 release 시점만 늦춥니다.
  - top 버튼의 programmatic scroll도 같은 gate를 사용해 이동 중 추가 입력을 무시합니다.

### 검증
- `git diff --check` 통과
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints
- 참고: sandbox 내부 첫 빌드는 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했고, 승인된 환경에서 같은 명령을 재실행해 통과했습니다.
- 진행 중: Superpowers requesting-code-review 기준 코드 리뷰

## 2026-05-21 History archive workflow portability cleanup

### 요구사항
- `HISTORY.md`를 최근 작업 버퍼로 유지하고 과거 기록은 날짜별 아카이브로 분리하려는 방향은 유지합니다.
- 다만 현재 구조가 개인 홈 디렉터리 기반 절대 경로를 포함하고, `history/` 폴더가 커밋에서 누락될 수 있는 리스크를 줄입니다.

### 구현
- `HISTORY.md`
  - 히스토리 관리 규칙을 더 명확하게 정리했습니다.
  - `history/` 폴더가 로컬 임시 폴더가 아니라 Git으로 추적되는 공식 아카이브임을 명시했습니다.
  - 집/회사 맥 전환을 고려해 절대 경로 링크 대신 상대 경로 링크만 쓰도록 규칙을 바꿨습니다.
  - 날짜별 archive index를 추가했습니다.
- `history/2026-05-20.md`
  - 파일 상단 제목을 추가해 다른 날짜 archive와 구조를 맞췄습니다.

### 검증
- `git diff --check` 통과
- `HISTORY.md`와 `history/` archive index의 현재 링크는 상대 경로만 사용합니다.

## 2026-05-21 Career to Work dissolve transition fix and timeline card layout overlap fix

### 요구사항
- Career에서 Work로 넘어갈 때 어둡게 디졸브되는 효과 과정에서 Work 화면이 한 번 더 튀거나(double flash) 비치는 버그를 수정합니다.
- Career timeline의 카드들이 스크롤로 인해 활성화되어 텍스트(h3, span)가 나타날 때, 공간이 확보되지 않아 아래 카드들과 글자가 겹치는(overlap) 현상을 레이아웃이 출렁이지 않으면서도 올바르게 동작하도록 수정합니다.

### 구현
- `src/components/HomePage.astro`
  - `snapCareerWorkCover` 함수에서 `movingToWork` 시점에 Work 클론(`workCover`)이 화면 아래에서 위로 슬라이드 업(`yPercent: 100 -> 0`)되는 기존 연출을 온전히 유지했습니다.
  - 이 과정에서 아래에 대기 중인 진짜 Work 섹션이 비쳐서 두 번 깜빡이는(double flash) 버그를 방지하기 위해, Career 클론인 `activeCareerWorkUnderlay`를 트랜지션 내내 완전히 불투명하게(`autoAlpha: 1.0`) 고정시켰습니다.
  - 오직 `--career-work-dim` CSS 변수만 `0`에서 `0.85`로 애니메이션(점점 어두워짐)하여, 어둡게 디졸브되는 효과와 슬라이드 업 연출이 레이아웃 깨짐이나 깜빡임 없이 매끄럽게 어우러지도록 수정했습니다.
  - 타임라인 카드 안에서 이력 정보가 세로 흐름을 가질 수 있도록 `h3`와 `span`을 래퍼 엘리먼트 `.timeline-card-details`와 `.timeline-card-details-inner`로 감쌌습니다.
- `src/styles/global.css`
  - `.timeline-card`를 `display: grid` 대신 `display: flex; flex-direction: column; justify-content: center;`로 변경하여 자식 요소들이 세로로 배치되고 카드 자체의 높이가 늘어날 수 있도록 했습니다.
  - `h3`와 `span`에 적용되어 있던 `position: absolute` 및 고정 `top` 값 계산식(desktop 및 mobile media query)을 완전히 제거하여 자연스러운 레이아웃 흐름(relative/static)을 갖게 했습니다.
  - `.timeline-card-details`에 CSS Grid를 활용하여 `grid-template-rows: 0fr -> 1fr` 트랜지션을 부여함으로써, 활성화(`is-active`) 시에 카드의 높이가 아코디언 형태로 매우 부드럽게 늘어나도록 처리했습니다. 이를 통해 아래 카드들을 부드럽게 밀어내어 글자 겹침을 방지하고 급격한 레이아웃 출렁거림도 억제했습니다.

### 검증
- `npm run build` 및 `astro check` 검증 완료 (0 errors / 0 warnings / 0 hints)
- 로컬 개발 서버 환경에서 Career-to-Work dissolve 전환이 튀는 현상 없이 깔끔하게 디졸브되는 것 확인
- 타임라인 카드가 스크롤 및 활성화 시 글자 겹침 없이 부드럽게 하단 카드를 밀어내며 작동하는 것 확인

## 2026-05-21 Career timeline point navigation

### 요구사항
- Career point를 클릭하면 해당 이력 지점으로 바로 이동하게 합니다.
- 웹과 모바일에서 동일하게 동작해야 합니다.
- 모바일 timeline 세로 라인은 `left: 33px`로 로고 중심축에 맞추고, dot/item들도 같은 기준으로 함께 이동합니다.
- 모바일 timeline 세로 라인이 화면 위아래에서 잘려 보이지 않고 충분히 꽉 차게 만듭니다.

### 구현
- `src/components/HomePage.astro`
  - timeline card에 `role="button"`, `tabindex="0"`, `aria-label`을 추가해 클릭 및 키보드 접근이 가능한 point로 만들었습니다.
  - `getCareerPointProgress()`와 `getCareerPointTop()`을 추가해 현재 desktop/mobile career progress mapping을 그대로 재사용합니다.
  - timeline card 클릭 및 Enter/Space 입력 시 기존 `snapToTarget()` 경로로 이동하도록 연결했습니다.
  - `careerProgress`를 `SnapTarget`에 추가해 일반 career 마지막 지점 이동과 특정 point 이동을 구분했습니다.
- `src/styles/global.css`
  - timeline card에 pointer cursor와 focus-visible outline을 추가했습니다.
  - 모바일 timeline line을 `left: 33px`로 이동하고, 기존 dot center alignment가 유지되도록 `.timeline-items` padding-left를 `67px`로 조정했습니다.
  - 모바일 line의 `top/bottom`을 `-60svh`로 확장해 stage overflow 안에서 화면 위아래가 비지 않도록 보강했습니다.

### 검증
- `git diff --check` 통과
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints

## 2026-05-21 Public image loading performance pass

### 요구사항
- 초기 GitHub push 시점보다 사이트가 무거워진 원인을 분석합니다.
- 현재 기능과 화면 구조는 유지하면서 개선 가능한 부분만 적용합니다.
- Superpowers의 systematic debugging 흐름으로 추측이 아니라 산출물/DB/에셋 근거를 기반으로 판단합니다.

### 분석
- 현재 빌드 산출물 기준 public 홈에서 직접 붙는 주요 client asset은 `HomePage` JS 약 132KB, 공용 CSS 약 28KB입니다.
- `/admin` 전용 React/Tiptap 청크(`client` 약 180KB, `BlockEditor` 약 380KB)는 `/admin` 라우트에 붙는 별도 island라 public 홈 라우트의 직접 초기 병목은 아닙니다.
- 로컬 D1 `assets` 기준 asset 총량은 약 64.5MB, 최대 단일 이미지는 약 8.7MB PNG입니다.
- 게시된 featured/gallery 작업물도 0.7MB~2.4MB급 원본 이미지를 `/media/...`로 그대로 사용합니다.
- 특히 gallery thumbnail은 `<img loading="lazy">`가 아니라 CSS `background-image: var(--tile-image)` 방식이라 브라우저 네이티브 lazy loading의 도움을 받지 못하고, 초기/근접 로딩 시 불필요하게 빨리 당겨질 수 있었습니다.

### 구현
- `src/components/HomePage.astro`
  - gallery thumbnail을 CSS background-image 구조에서 실제 `<img loading="lazy" decoding="async">` 구조로 변경했습니다.
  - 기존 cover crop 시각은 CSS `object-fit: cover`로 유지했습니다.
  - featured image와 profile image에도 `decoding="async"`/lazy loading을 보강했습니다.
- `src/styles/global.css`
  - `.work-tile-media`의 `background-image` 의존을 제거하고 내부 `<img>`가 16:9 영역을 cover하도록 스타일을 추가했습니다.
- `src/components/WorkBlocks.astro`
  - 상세 본문 image/gallery 블록 이미지에 `decoding="async"`를 추가했습니다.
- `src/pages/work/[slug].astro`
  - 상세 페이지 상단 cover 이미지에 `decoding="async"`와 `fetchpriority="high"`를 추가해 상세 진입 시 첫 cover 우선순위를 명확히 했습니다.

### 남은 주의점
- R2 원본 이미지 자체가 큰 것은 그대로입니다. 이번 변경은 “초기/불필요한 선로딩”을 줄이는 코드 레벨 개선입니다.
- 더 큰 체감 개선이 필요하면 기존 R2 이미지를 리사이즈/재압축하거나, 업로드 시 thumbnail/featured/detail variant를 따로 생성하는 이미지 파이프라인이 필요합니다.

### 검증
- `git diff --check` 통과
- `npm run build` 통과, `astro check` 0 errors / 0 warnings / 0 hints
- 빌드된 HomePage 서버 chunk에서 gallery thumbnail이 `loading="lazy" decoding="async"`가 붙은 `<img>`로 렌더링되는 것을 확인했습니다.

## 2026-05-21 Work intro color and admin media upload refinement

### 요구사항
- Work intro 섹션의 배경을 메인 accent color(`--color-acid`)로 바꾸고, 로고와 `WORK.` 타이틀은 검정색으로 바꿉니다.
- Admin 작업물 에디터의 썸네일 파일 업로드 input을 기본 브라우저 UI가 아닌 점선 테두리 Drag & Drop 업로드 존으로 바꿉니다.
- Admin 우측 `LIVE PREVIEW` 상단의 `Open` 텍스트 버튼을 직관적인 외부 열기 아이콘 버튼으로 바꿉니다.
- 특히 업로드 UI가 모바일에서 깨지지 않도록 반응형 크기를 조정합니다.

### 구현
- `src/styles/global.css`
  - `.work-intro-section` 배경을 `var(--color-acid)`로 변경했습니다.
  - Work intro 내부 로고에는 `filter: brightness(0)`을 적용하고, 제목과 점은 `var(--color-ink)`/`currentColor`로 통일했습니다.
- `src/components/admin/AdminApp.tsx`
  - `WorkLivePreview`의 `Open` 텍스트를 accessible label이 있는 아이콘 링크로 교체했습니다.
  - 작업물 이미지 업로드 input을 `.media-upload-zone` label 내부의 숨김 input으로 바꾸고, 클릭 업로드와 파일 드롭 업로드를 모두 지원하도록 했습니다.
- `src/styles/admin.css`
  - 점선 테두리, 업로드 아이콘, 안내 문구, 저장 안내 문구를 포함한 업로드 존 스타일을 추가했습니다.
  - 660px 이하 모바일에서 업로드 존 높이, 아이콘, 문구 크기를 줄여 카드 폭 안에서 안정적으로 감싸지도록 조정했습니다.
  - Live preview 외부 열기 링크를 정사각형 아이콘 버튼으로 정리했습니다.

### 검증
- `git diff --check` 통과
- `npm run build`
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서 `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete 확인했습니다.
