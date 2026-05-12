# HISTORY.md

이 파일은 집/회사 환경과 Codex 세션이 달라도 다음 에이전트가 작업 맥락을 바로 이어받을 수 있도록 남기는 작업 기록입니다. 새 커밋이나 푸시를 만들기 전에는 이 파일에 변경 이유, 구현 방식, 검증 결과를 추가하세요.

## 2026-05-12 Work image role simplification

### 요구사항
- WORK image 역할을 gallery thumbnail / featured thumbnail 두 개로 단순화합니다.
- Gallery thumbnail은 16:9 가로 비율로 바꾸고, work detail 상단 cover와 동일 asset을 사용합니다.
- 기존 본문 hero image 영역과 admin hero 업로드 항목은 제거합니다.
- Detail 상단 cover 영역을 기존보다 약 1.5배 높이고, cover blur가 더 확실히 보이게 조정합니다.
- Featured work에서 detail로 진입할 때 어색한 shared view transition이 발생하지 않게 합니다.

### 구현
- `src/components/HomePage.astro`
  - Featured work의 `더 알아보기` 링크에 `data-astro-reload`를 붙여 gallery shared-element transition과 분리했습니다.
  - Gallery tile의 `work-media-{slug}` transition은 유지해 gallery thumbnail → detail cover 경로만 shared transition을 사용합니다.
- `src/pages/work/[slug].astro`
  - Detail 상단 cover는 `thumbnail`만 사용합니다. Thumbnail이 없으면 placeholder로 처리합니다.
  - 기존 `work-detail-media` 본문 hero image section을 제거했습니다.
- `src/components/admin/AdminApp.tsx`
  - WORK media upload field를 `Gallery thumbnail`, `Featured thumbnail` 두 개만 남겼습니다.
  - Gallery thumbnail 설명을 16:9 가로 이미지 및 detail top cover 공용 용도로 수정했습니다.
  - Work 저장 시 legacy `heroAssetId`/`hero`는 `null`로 보내 기존 연결이 다시 저장되지 않게 했습니다.
  - Admin live preview도 gallery thumbnail 기준으로 표시합니다.
- `src/styles/global.css`
  - Gallery thumbnail aspect ratio를 `16 / 9`로 변경했습니다.
  - Detail cover height를 `clamp(390px, 51svh, 540px)`로 키웠습니다.
  - Detail cover blur overlay의 opacity/blur/mask를 강화했습니다.
  - 사용하지 않는 `work-detail-media`/`work-detail-placeholder` 스타일을 제거했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- `/work/rush-hour-app` 브라우저 DOM 확인
  - `data-cover-image`가 gallery thumbnail asset `/media/uploads/2026/05/00df4d6c...png`를 사용
  - `work-detail-media` 제거 확인
  - Work blocks는 계속 렌더링 확인
- `/work` HTML에서 featured detail link에 `data-astro-reload`가 붙는 것 확인

## 2026-05-12 Smooth top scroll and gallery-cover transition alignment

### 요구사항
- Gallery 하단 top button은 새로고침/라우팅이 아니라 부드러운 스크롤로 intro까지 이동해야 합니다.
- Top 이동 중에는 기존 snap/career lock/scroll snap이 중간에 다시 개입하지 않게 해야 합니다.
- Gallery thumbnail에서 work detail 상단 cover로 이어지는 View Transition이 자연스럽도록 두 이미지 소스를 동일하게 맞춥니다.
- Admin 이미지 업로드 설명도 변경된 이미지 역할에 맞게 정리합니다.

### 구현
- `src/layouts/PublicLayout.astro`
  - Floating top button을 다시 `<button>`으로 바꾸고, 홈 페이지가 제공하는 `window.__portfolioScrollToTop()`이 있으면 해당 전용 스크롤 함수를 호출합니다.
  - 홈 페이지가 아닌 detail 등에서는 일반 smooth `window.scrollTo({ top: 0 })` fallback을 사용합니다.
- `src/components/HomePage.astro`
  - Top button 전용 programmatic scroll 상태를 추가했습니다.
  - Top 이동 중에는 `snapObserver`를 끄고, career item input lock을 초기화하며, `html/body` inline `scrollSnapType = "none"`을 임시 적용합니다.
  - GSAP `scrollTo`는 `overwrite: true`로 실행하고, snap/lock 복구와 `ScrollTrigger.refresh()`는 `onComplete`에서 처리합니다. interrupt 시에도 inline snap style은 복구합니다.
  - `/work` alias에서 top button으로 intro 이동 시 더 이상 `/work` route preserve가 남지 않도록 처리했습니다.
- `src/pages/work/[slug].astro`
  - Detail 상단 cover는 `hero`보다 `thumbnail`을 우선 사용합니다. Gallery tile의 `work-media-{slug}` transition source와 detail cover target이 같은 asset을 바라보게 됩니다.
- `src/components/admin/AdminApp.tsx`
  - Gallery thumbnail 설명에 “WORK gallery card와 상세 상단 transition cover에 사용”된다는 내용을 반영했습니다.
  - Admin live preview의 상단 preview image도 thumbnail 우선으로 맞췄습니다.
- `src/styles/global.css`
  - Floating top button의 z-index를 높이고 touch action을 정리해 gallery card 위에서 클릭 target이 밀리지 않게 했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- `/work` HTML에서 floating top button이 button으로 출력되는 것 확인
- `/work/rush-hour-app` HTML에서 detail 상단 cover가 gallery thumbnail과 같은 `/media/uploads/2026/05/00df4d6c...png`를 쓰고, 본문 대표 이미지는 기존 hero 이미지를 쓰는 것 확인

## 2026-05-12 Admin hydration cache and media/sidebar polish

### 요구사항
- Gallery 하단 floating top button을 눌러도 반응하지 않는 문제를 해결합니다.
- 로컬 `/admin`이 흰 화면 또는 `Loading admin...` 상태로 멈추는 문제를 중점적으로 해결합니다.
- Admin WORK editor의 media upload card/preview가 편집 프레임 밖으로 튀어나가지 않게 합니다.
- Admin sidebar collapse 상태에서 logout button 크기를 정상화하고, nav label 옆 icon을 추가합니다. Collapse 시에는 icon만 남깁니다.

### 구현
- `src/layouts/PublicLayout.astro`
  - Floating top button을 custom scroll event 대신 `href="/"` + `data-astro-reload` 링크로 처리했습니다.
  - Astro ClientRouter와 home scroll lock이 클릭을 가로막지 않도록 top 이동은 full navigation으로 분리했습니다.
- `astro.config.mjs`
  - iCloud 폴더의 `.vite/deps 2` 충돌을 피하기 위해 Vite cache를 `node_modules` 아래로 이동했습니다.
  - Build가 만든 production `react/jsx-dev-runtime` cache를 dev server가 재사용하면서 `jsxDEV is not a function`으로 admin hydration이 깨지던 문제를 막기 위해 dev/build cache를 분리했습니다.
  - `zod/v4`도 optimize exclude에 추가했습니다.
- `src/pages/admin.astro`
  - React island renderer 판별이 안정적으로 되도록 `AdminApp.tsx` 확장자를 명시해 import합니다.
- `src/components/admin/AdminApp.tsx`
  - Sidebar nav/logout에 inline SVG icon을 추가했습니다.
  - Collapse 상태에서는 label을 숨기고 icon만 남기도록 구조를 정리했습니다.
- `src/styles/admin.css`
  - Collapsed sidebar의 nav/logout button을 `46px` 정사각형으로 고정해 logout button이 과도하게 길어지지 않게 했습니다.
  - Media upload grid를 `auto-fit + minmax(min(100%, 240px), 1fr)`로 바꾸고, field/header/input/preview에 `min-width: 0`과 overflow containment를 적용했습니다.
  - Remove button은 card 내부에서 줄바꿈/축소되도록 정리했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- Fresh dev server `http://127.0.0.1:4325`에서 `/admin` 확인
  - `Admin Login` 렌더링 확인
  - `Loading admin...` fallback이 사라지는 것 확인
  - Build 실행 후에도 dev `/admin` hydration이 유지되는 것 확인
- `/work` HTML에서 floating top button이 `href="/"`와 `data-astro-reload`를 가진 링크로 출력되는 것 확인

### 참고
- 기존 dev tab이 오래된 optimized React runtime을 물고 있으면 hard reload 또는 dev server 재시작이 필요할 수 있습니다. 현재 설정에서는 fresh tab/dev server 기준 정상 동작합니다.

## 2026-05-12 Admin isolation and top-button scroll fix

### 요구사항
- Gallery 하단에서 floating top button을 누르면 career item scroll lock 구간에서 멈추지 않고 맨 위로 이동해야 합니다.
- About에서 career로 넘어가는 스크롤 길이가 마지막 커밋/푸시 버전보다 길어진 느낌이 있어 이전 값으로 되돌립니다.
- View Transition 적용 이후 `/admin`이 흰 화면만 나오는 문제를 분석하고 해결합니다.

### 구현
- `src/layouts/BaseLayout.astro`
  - Admin에서도 `ClientRouter` import side effect가 섞이지 않도록 BaseLayout은 다시 순수 공통 layout으로 정리했습니다.
  - React Refresh preamble은 기존처럼 admin dev에서만 유지합니다.
- `src/layouts/PublicLayout.astro`
  - 새 공개 페이지 전용 layout을 만들고, `ClientRouter`, gallery/detail route swap 보정, floating top button script를 이쪽으로 분리했습니다.
  - Admin은 PublicLayout을 거치지 않으므로 View Transition client router와 floating button script가 로드되지 않습니다.
- `src/components/HomePage.astro`
  - BaseLayout 대신 PublicLayout을 사용합니다.
  - `identityTravelSvh`를 이전 커밋 기준인 `Math.max(210, 126 + timeline.length * 18)`로 되돌려 about→career 진입 스크롤 길이를 줄였습니다.
  - Floating top button 전용 `portfolio:scroll-top` 이벤트를 받아 career lock을 초기화하고, home snap observer를 잠깐 비활성화한 뒤 즉시 intro 위치로 이동하게 했습니다.
- `src/pages/work/[slug].astro`
  - Work detail도 PublicLayout을 사용하도록 변경했습니다.
- `src/pages/admin.astro`
  - Admin은 `client:only="react"`를 유지합니다. `client:load`는 dev SSR에서 React duplicate hook 오류가 발생해 사용하지 않습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 새 dev server `http://127.0.0.1:4324`에서 `/admin` DOM 확인: `Admin Login`, username/password input, login button 렌더링 확인
- `/admin` HTML에서 `ClientRouter`/route announcer가 빠지고 admin island만 남는 것 확인
- `/work` 직접 진입 URL이 `/work`로 유지되는 것 확인
- 검증용 dev server 포트 `4323`, `4324` 프로세스 종료 완료

### 참고
- 기존 dev server/HMR 캐시가 꼬인 경우 `/admin`이 계속 흰 화면이면 dev server를 재시작하세요. 이번 변경은 fresh dev server 기준 정상 렌더링됩니다.

## 2026-05-12 Gallery-detail view transition and top button

### 요구사항
- WORK gallery에서 work detail로 들어가고 다시 나올 때 Astro View Transitions API를 사용해 썸네일이 detail cover로 자연스럽게 이어지는 느낌을 만듭니다.
- Gallery/detail 이동이 정적 이미지처럼 뚝 끊기지 않도록 client-side transition을 적용합니다.
- 페이지 하단에 도달하면 우측 하단에 원형 top button을 띄우고, 흰색 배경/그림자 기반에서 hover 시 메인 accent color로 바뀌게 합니다.
- Intro scroll cue의 dot animation duration을 `2.5s`로 변경하고, loop 시작 시 dot이 갑자기 튀어나오지 않도록 fade-in/fade-out 구조로 바꿉니다.

### 구현
- `src/layouts/BaseLayout.astro`
  - Astro 공식 View Transitions 문서 방식대로 `ClientRouter`를 공통 layout head에 추가했습니다.
  - `/work/*`에서 `/work`로 돌아올 때 전환 중 새 문서가 gallery scroll position을 먼저 잡도록 `astro:after-swap`에서 `.gallery-section` 위치로 instant scroll을 보정합니다.
  - 전역 floating top button과 rerun-safe inline script를 추가했습니다. Admin body에서는 숨깁니다.
- `src/components/HomePage.astro`
  - Gallery thumbnail media에 `transition:name="work-media-{slug}"`, tile title에 `transition:name="work-title-{slug}"`를 추가했습니다.
  - ClientRouter 적용 후에도 홈 스크롤 스크립트가 다시 초기화되도록 기존 GSAP setup을 `astro:page-load` 기반 initializer로 감쌌습니다.
  - 페이지 전환 전에는 GSAP Observer/ScrollTrigger/window listener를 정리해 detail/admin 페이지 스크롤을 방해하지 않게 했습니다.
  - `/work` alias 진입 시 gallery route가 `/`로 정리되는 부작용을 줄이도록 gallery 위치에서는 `/work`를 유지합니다.
- `src/pages/work/[slug].astro`
  - Detail cover와 h1에 gallery와 같은 transition name을 부여했습니다.
  - Detail cover/topbar script도 `astro:page-load` 기반으로 재초기화하고, 전환 전 listener를 정리합니다.
- `src/styles/global.css`
  - Shared element transition duration/easing을 조정했습니다.
  - Floating top button 스타일을 추가했습니다.
  - Intro scroll cue dot animation을 `2.5s`로 바꾸고, 시작/종료 opacity가 0인 keyframe으로 loop 재시작 튐을 줄였습니다.

### 검증
- Astro 공식 문서의 `ClientRouter`, `transition:name`, `astro:page-load`, `astro:after-swap` 사용 방식 확인
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 dev server `http://127.0.0.1:4322`에서 브라우저 확인
  - `/work` 직접 진입 시 gallery가 보이고 URL이 `/work`로 유지됨
  - 첫 gallery tile 클릭 시 `/work/rush-hour-app` 상세로 이동하고 cover/header가 렌더링됨
  - Detail back arrow 클릭 시 `/work` gallery로 복귀하고 `ALL` filter가 유지됨

### 참고
- View Transitions는 브라우저 지원에 따라 native shared element transition 또는 Astro fallback으로 동작합니다. `prefers-reduced-motion` 환경에서는 Astro router가 애니메이션을 줄입니다.

## 2026-05-12 Home interaction and detail typography refinement

### 요구사항
- Intro scroll 유도 요소를 SVG 단독 아이콘에서 CSS mouse + 안내 문구 형태로 변경합니다.
- 이후 유도 문구는 다시 제거하고 CSS mouse만 남깁니다. Mouse outline/dot 크기와 3초 loop 애니메이션을 참고 코드에 가깝게 조정합니다.
- Intro headline 뒤 점 blink 속도를 기존보다 2배 느리게 합니다.
- About 연락처 앞 라벨 문자를 제공된 email/phone/mappin SVG 아이콘으로 교체합니다.
- Admin 좌측 sidebar를 최소화/복원하는 toggle 버튼을 추가합니다.
- Career item 전환 애니메이션 중 연속 wheel/touch/key 입력으로 여러 item이 지나치게 넘어가는 현상을 줄입니다.
- Featured work dot indicator가 흰 배경에서도 보이도록 약한 shadow를 추가합니다.
- Featured work 상세 링크는 전체 card가 아니라 `더 알아보기` 라벨에만 걸고, hover 시 화살표만 left-right sweep 애니메이션을 줍니다.
- Featured work 상세 링크 hover/focus 시 underline도 표시합니다.
- Work detail hero title은 4vw 기준으로 낮추고, summary 본문은 20px로 맞춥니다.
- Detail cover blur layer가 cover gradient와 같은 방향/강도로 적용되도록 mask를 맞춥니다.
- 사이트 전반에 `word-break: keep-all`을 적용합니다.
- Work gallery thumbnail에 약한 회색 border line을 추가합니다.
- Gallery/featured/detail 등 cover image container에서 검정 background가 비치지 않도록 image cover 배경을 transparent로 정리합니다.

### 구현
- `src/components/HomePage.astro`
  - Intro scroll cue 마크업은 빈 `<p>` 기반 CSS mouse만 남겼습니다.
  - About 연락처에 `/assets/figma/email.svg`, `/assets/figma/phone.svg`, `/assets/figma/mappin.svg`를 렌더링합니다.
  - Featured work 전체 card anchor를 제거하고, `.featured-more` 링크만 실제 hyperlink로 남겼습니다.
  - Career active timeline index가 바뀐 직후 `360ms` 동안 추가 wheel/touch/key scroll 입력을 막는 guard를 추가했습니다. 기존 snap 구조와 progress 기반 career 동작은 유지했습니다.
- `src/components/admin/AdminApp.tsx`
  - `sidebarCollapsed` state와 sidebar toggle button을 추가했습니다.
  - Sidebar collapse 상태에서는 navigation/logout 라벨을 시각적으로 줄이고 단축 문자만 노출합니다.
- `src/styles/admin.css`
  - `.admin-shell.is-sidebar-collapsed` 레이아웃과 collapsed sidebar button/label 스타일을 추가했습니다.
- `src/styles/global.css`
  - Body에 `word-break: keep-all`과 `overflow-wrap: break-word`를 적용했습니다.
  - Intro scroll cue를 CSS mouse outline + animated wheel dot만 보이도록 스타일링하고, intro dot blink를 `1s`로 늦췄습니다.
  - Contact icon, featured dot shadow, featured link arrow hover animation/underline, gallery thumbnail border를 추가했습니다.
  - Work detail h1은 `clamp(42px, 4vw, 76px)`, hero summary는 `20px`로 조정했습니다.
  - Detail cover blur pseudo-layer의 mask gradient를 visual gradient와 같은 stop 구조로 맞췄습니다.
  - `.work-visual`, `.work-tile-media`, `.work-detail-media`, `.work-block-image img` 등 cover image container의 검정 background를 transparent로 바꿨습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 Chrome headless 확인
  - Intro cue text가 비어 있고 CSS mouse pseudo-element가 `20px x 30px`로 렌더링되는 것 확인
  - Intro dot blink computed animation duration `1s` 확인
  - `body` computed `word-break: keep-all` 확인
  - Work detail h1/p computed font-size 확인
  - About 연락처 SVG 3개 렌더링 확인
  - Work gallery thumbnail border `rgba(0, 0, 0, 0.14) 1px` 확인
  - Featured active panel의 link가 `.featured-more` 하나만 남은 것 확인
  - Work gallery thumbnail computed background color가 transparent인 것 확인
  - Admin sidebar toggle 클릭 전/후 grid column이 `280px`에서 `84px`로 바뀌는 것 확인

## 2026-05-11 Detail, featured, admin media refinement

### 요구사항
- Work detail 초기 화면에서는 상단바 blur/border가 보이지 않고, 제목이 가려진 뒤에만 blur topbar와 title이 표시되어야 합니다.
- Work detail meta 첫 항목 위의 불필요한 top border를 제거합니다.
- Admin work 이미지 업로드 영역의 preview가 너무 커져 레이아웃을 자르지 않게 하고, 이미지 삭제 버튼을 추가합니다.
- Admin 저장/오류 피드백을 팝업 toast로 표시합니다.
- Featured work 우측에 전체 개수와 현재 위치를 dot indicator로 보여줍니다.
- 메인 intro에 scroll 유도 SVG 애니메이션을 추가합니다.
- Career item 전환 스크롤 거리를 현재보다 약 3배 길게 둡니다.
- Featured work 전환에서 이미지만 blur 처리하고 텍스트는 fade만 적용합니다.
- Featured work image blur edge에 흰색이 보이면 마지막 커밋 버전의 backdrop-filter overlay 방식으로 되돌리되, 텍스트는 fade만 유지합니다.
- Featured work 전용 thumbnail을 gallery thumbnail과 별도로 관리할 수 있게 합니다.

### 구현
- `src/components/HomePage.astro`
  - Intro 하단에 SVG scroll cue를 추가했습니다.
  - Career section travel 값을 `126 + timeline.length * 54` 기준으로 늘려 item focus 전환을 느리게 했습니다.
  - Featured work는 `featuredThumbnail ?? thumbnail` 이미지를 사용하고, 우측 dot indicator를 active panel과 동기화합니다.
- `src/styles/global.css`
  - Work detail topbar는 기본 transparent 상태이고 `data-title-hidden="true"`일 때만 paper blur/background/border가 켜집니다.
  - Work detail meta 첫 번째 item의 top border를 제거했습니다.
  - Featured 전환 blur는 `.work-visual` 직접 filter 대신 `.featured-link::before`의 `backdrop-filter` overlay 방식으로 되돌렸고, `.featured-copy`는 opacity fade만 사용합니다.
  - Intro scroll cue와 featured dots 스타일/애니메이션을 추가했습니다.
- `src/components/admin/AdminApp.tsx`
  - Tiptap `BlockEditor`를 top-level import에서 `React.lazy`로 바꿔 Cloudflare dev SSR에서 Tiptap이 바로 평가되지 않게 했습니다.
  - `EditorBoundary`를 추가해 editor chunk 오류가 works 탭 전체 흰 화면으로 번지지 않게 했습니다.
  - Work media editor를 `Gallery thumbnail`, `Featured thumbnail`, `Hero` 3개 필드로 분리했습니다.
  - 각 이미지 필드에 권장 비율 hint, compact preview, `Remove` 버튼을 추가했습니다.
  - 저장/오류 메시지는 fixed toast로 표시합니다.
- `astro.config.mjs`
  - `client:only` admin 환경에서 Tiptap editor가 브라우저에서 정상 로드되도록 Tiptap 패키지와 `use-sync-external-store` shim을 Vite optimizeDeps include로 명시했습니다.
  - `drizzle-orm`, `drizzle-orm/d1`, `drizzle-orm/sqlite-core`, `zod`는 Cloudflare/server dependency로 optimizeDeps exclude를 유지했습니다.
- 데이터 모델
  - `works.featured_thumbnail_asset_id` 컬럼을 추가하는 `migrations/0003_featured_thumbnail.sql`을 만들었습니다.
  - `src/types.ts`, `src/lib/validation.ts`, `src/db/schema.ts`, `src/lib/admin-data.ts`, `src/lib/content.ts`에 `featuredThumbnailAssetId`/`featuredThumbnail`을 연결했습니다.
- `src/layouts/BaseLayout.astro`
  - 로컬 dev admin 화면에만 React Refresh preamble을 명시적으로 주입합니다. 로컬 `/admin`이 `Loading admin...`에서 멈추는 원인이 AdminApp client module의 `window.$RefreshReg$` preamble check 실패였기 때문입니다.

### 검증
- `npm run db:migrate:local` 통과
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 dev 서버 `http://127.0.0.1:4323` 기준 `/admin`, `/work`, `/work/rush-hour-app` 응답 `200 OK`
- 로그인 전 `/api/admin/profile` 응답 `401 Unauthorized` 확인
- Chrome headless + 로컬 admin 세션 쿠키로 `/admin` 진입 후 `works` 탭 클릭 확인: `.works-admin-grid` 1개, `.block-editor` 1개, `.admin-editor-loading.error` 0개 렌더링.
- Work detail `/work/rush-hour-app` 렌더링 확인: 첫 meta item의 computed `border-top-width`/`padding-top`은 `0px`.

### 참고
- 원격 D1에도 배포 전 `npm run db:migrate:remote` 또는 동일한 Wrangler remote migration 적용이 필요합니다.
- 기존 작업물은 `featured_thumbnail_asset_id`가 비어 있으면 자동으로 기존 gallery `thumbnail`을 featured image로 fallback합니다.

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
- Detail cover 높이가 과하게 늘어난 문제를 줄이고, cover 이미지는 우선 placeholder 상태로 유지합니다.
- Detail cover의 흰색 fade/gradient가 페이지 회색 배경과 분리되어 보이지 않게 맞춥니다.
- Detail cover에는 이미지가 있으면 다시 표시하고, 이미지가 없을 때만 회색 배경 placeholder로 둡니다.
- Detail category(`section-kicker`) 크기를 키우고, fixed back button 뒤에 blur topbar를 추가해 본문과 겹칠 때도 가독성을 유지합니다.
- Detail title이 스크롤로 가려지면 blur topbar에 같은 title을 표시합니다.
- Detail category(`section-kicker`) opacity를 50%로 낮춥니다.
- 로컬 `/admin` 접속 실패 여부를 확인합니다.

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
  - Fixed cover에는 아래로 갈수록 `var(--color-paper)`가 강해지는 linear gradient와 masked `backdrop-filter` blur layer를 올렸습니다.
  - Scroll progress를 받는 paper-color fade overlay를 추가해 본문이 cover 위로 올라올 때 이미지가 페이지 배경색으로 자연스럽게 사라지게 했습니다.
  - Cover 높이를 `clamp(260px, 34svh, 360px)`로 낮추고, detail hero의 기존 `min-height: 70svh`를 제거해 상단 영역이 과도하게 길어지지 않도록 했습니다.
  - Cover media는 `work.hero ?? work.thumbnail` 이미지를 다시 렌더링하고, 이미지가 없으면 장식 gradient 없이 `var(--color-paper)`만 표시합니다.
  - Back arrow 영역에 fixed `.work-detail-topbar`를 추가하고 `backdrop-filter`를 적용했습니다.
  - Detail `.work-hero .section-kicker` 크기를 키웠습니다.
  - `.work-topbar-title`을 추가하고 `data-title-hidden="true"`일 때만 opacity가 올라오도록 했습니다.
  - Detail `.work-hero .section-kicker` opacity를 `0.5`로 낮췄습니다.
- `src/pages/work/[slug].astro`
  - Back link visible text를 `←`로 줄이고 `aria-label="Back to work"`를 유지했습니다.
  - Detail hero 위에 `work.hero ?? work.thumbnail` 기반 cover 영역을 추가했습니다.
  - Cover 이미지 luminance를 canvas로 샘플링해 back arrow 색상을 검정/흰색으로 자동 전환합니다.
  - Cover scroll progress를 requestAnimationFrame 기반으로 CSS variable `--cover-fade`에 반영합니다.
  - 최신 수정에서는 cover image 렌더링을 복구하고, back arrow를 blur topbar 내부로 옮겼습니다.
  - Topbar title을 렌더링하고, scroll 시 heading bottom이 topbar 높이 아래로 들어오면 `data-title-hidden`을 켭니다.
- Admin 확인
  - `/admin` 라우트 파일은 `src/pages/admin.astro`에 존재합니다.
  - dev 서버가 꺼져 있으면 접속이 실패합니다. 서버 재시작 후 `/admin`은 GET 기준 `200 OK`입니다.
  - Admin CMS는 `client:only="react"`로 전환해 React hooks가 서버 렌더링 중 실행되지 않도록 했습니다.
  - `astro.config.mjs`에서 `drizzle-orm`, `drizzle-orm/d1`, `drizzle-orm/sqlite-core`, `zod`, Tiptap editor 패키지를 Vite optimizeDeps 제외 목록에 추가했습니다. Cloudflare/Vite dev 서버가 dependency cache 파일을 잃으면서 `/admin`이 500 또는 흰 화면으로 흔들리는 현상을 줄이기 위한 조치입니다.
  - `client:only` 상태에서도 빈 화면만 보이지 않도록 `Loading admin...` fallback을 추가했습니다.
  - `curl -I` HEAD 요청이나 빌드 직후 HMR 중에는 Cloudflare Vite/Miniflare dev 서버가 일시적으로 `500`을 낼 수 있어, 실제 브라우저 확인은 GET 기준으로 보세요.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 dev 서버 `http://127.0.0.1:4321` 기준 `/admin`, `/work/rush-hour-app` 응답 `200 OK`
- 로그인 전 `/api/admin/profile` 응답 `401 Unauthorized` 확인

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
