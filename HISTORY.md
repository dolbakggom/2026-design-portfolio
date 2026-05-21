# HISTORY.md

이 파일은 집/회사 환경과 Codex 세션이 달라도 다음 에이전트가 작업 맥락을 바로 이어받을 수 있도록 남기는 작업 기록입니다. 새 커밋이나 푸시를 만들기 전에는 이 파일에 변경 이유, 구현 방식, 검증 결과를 추가하세요.

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

## 2026-05-20 Admin work editor bottom actions cleanup

### 요구사항
- 작업물 에디터 화면은 상단바에 Save 버튼이 있으므로, 에디터 하단의 플로팅 Save 버튼은 제거합니다.
- Delete는 플로팅 액션이 아니라 에디터 최하단에 정적으로 배치합니다.
- 데스크톱과 모바일 모두 같은 구조로 동작하게 합니다.
- 모바일에서는 상단 햄버거 드로어가 사이드바 제어 역할을 하므로, 사이드바 내부 collapse 토글은 노출하지 않습니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - 작업물 에디터 하단 `.work-editor-actions`에서 `Save work` 버튼을 제거했습니다.
  - 해당 row에서 `sticky-actions` 클래스를 제거해, `Delete work`만 에디터 콘텐츠 끝에 정적으로 남도록 했습니다.
  - 모바일 admin 상태(`isMobileAdmin`)에서는 `.sidebar-toggle` 버튼을 렌더링하지 않도록 조건 처리했습니다.
- `src/styles/admin.css`
  - `.work-editor-actions` 간격을 정적 하단 액션에 맞게 조정했습니다.
  - 모바일에서 하단 Save 버튼만 숨기던 임시 CSS를 제거했습니다. 이제 하단 Save 자체가 렌더링되지 않습니다.

### 검증
- `git diff --check` 통과
- `npm run build`
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서 `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete 확인했습니다.

## 2026-05-20 Scroll Snap & Trackpad Inertia Filtering Heuristic

### 요구사항
- Career에서 Work 섹션으로 전환되는 순간, 마우스 한 틱의 스크롤만으로 다음 Featured Work 카드로 premature하게 즉시 넘어가거나, 트랙패드 관성(Inertia)으로 인해 Work 섹션 정렬이 엇나가고 다음 카드로 흘러내리는 현상을 완전히 해결합니다.
- 트랙패드의 긴 스와이프 관성(Momentum)이 애니메이션 및 포스트-스냅 락 시간(240ms)보다 길게 지속되더라도 다음 transition을 트리거하지 않도록 방어 로직을 강화합니다.

### 구현
- `src/components/HomePage.astro`
  - **Quiet Period Heuristic 도입:** `needsQuietPeriod` 상태 플래그와 `lastScrollEventTime` 타임스탬프를 도입했습니다.
  - 스냅 애니메이션이 시작될 때(`snapToTarget`) `needsQuietPeriod = true`를 세팅하고, `wheel` 및 `touchmove` 이벤트가 발생할 때마다 `lastScrollEventTime`을 갱신합니다.
  - 마우스 휠/터치패드 관성 스크롤 스트림이 완전히 끝나 150ms 이상 조용해질 때까지(`Date.now() - lastScrollEventTime > 150`) `needsQuietPeriod` 상태를 유지하며 이 기간 동안의 모든 휠/터치 입력을 무시하고 `preventDefault()` 처리합니다.
  - `isScrollLocked()`에 `needsQuietPeriod` 조건을 통합하여 관성 감쇠 동안 어떠한 추가 스냅 트랜지션도 접수되지 않도록 차단했습니다.
  - 자동 경계 보정 로직(`canAutoBoundaryCorrect`)에 `!needsQuietPeriod` 조건을 적용하여 관성이 유입되는 동안 자동으로 오버슈트 보정이 오작동하지 않게 보호했습니다.
  - 커리어 마지막 카드가 활성화된 직후의 스크롤 락(`careerItemLockedUntil`) 감지 범위를 `identity` 섹션 전체 근처(`[getIdentityTop() - 100, getWorkTop() + 100]`)로 넓혀 경계면 이탈 락이 누수되지 않도록 수정했습니다.
  - 후속 점검에서 `needsQuietPeriod`가 새 스냅 트랜지션뿐 아니라 이미 밀린 Work intro 위치 보정까지 막을 수 있는 경로를 발견했습니다.
  - `syncSnapObserver()`에서 quiet/lock 상태 중 `workTop`과 첫 featured 사이로 scrollY가 밀린 경우, 새로운 section snap을 발생시키지 않고 `window.scrollTo(workTop)`으로 즉시 보정하는 `guardedWorkOvershoot` 경로를 추가했습니다.
  - `syncSnapObserver()`가 매 scroll event마다 `lastScrollEventTime`을 갱신하던 부분은 제거했습니다. quiet 판정은 실제 wheel/touch 입력 시간 기준이어야 하며, programmatic scroll 동기화가 입력 시간을 계속 갱신하면 quiet window가 의도와 다르게 유지될 수 있습니다.

### 검증
- Puppeteer 기반의 브라우저 스크롤 시뮬레이터를 사용해 60fps 감속 프레임으로 모사된 트랙패드 관성(30회 연속 감속 WheelEvent)을 Work 진입 순간 주입하는 테스트를 수행했습니다.
- 관성 스크롤이 들어오는 동안 Work 섹션 시작 좌표(`scrollY = 2616`)에 완벽하게 Snapped된 채 움직이지 않는 것을 확인했습니다.
- 관성이 완전히 소멸된 후(300ms 대기) 새로 입력한 deliberate wheel event에 의해서만 다음 Featured Work 카드로 부드럽게 스냅되는 것을 확인했습니다.
- 검증 시나리오 기록 비디오 `scroll_transition_inertia_fix.webm`을 생성하여 아티팩트 폴더에 저장했습니다.
- `npm run build` 결과 `0 errors / 0 warnings / 0 hints`로 성공하였습니다.

## 2026-05-20 Chrome strong wheel career-to-work overshoot guard

### 요구사항
- Chrome에서 career point 시작 부근에서 강하게 스크롤하면 Work intro에 도착했을 때 정렬점보다 아래로 밀려 featured work 일부가 보이는 문제를 수정합니다.
- Safari에서는 정상 동작하므로 Safari 분기는 건드리지 않습니다.

### 구현
- `src/components/HomePage.astro`
  - `syncSnapObserver()`의 career -> work 자동 스냅 조건을 확장했습니다.
  - 기존에는 현재 scrollY가 `careerExitTop` 이후이면서 아직 `workTop` 이전일 때만 Work intro로 snap했습니다.
  - Chrome 큰 wheel delta는 한 frame 안에 `workTop`을 넘어 Work intro 내부로 들어갈 수 있어 조건을 놓쳤습니다.
  - 이전 scrollY가 work 위에 있었고 현재 scrollY가 career exit 이후부터 첫 featured 이전 사이에 있으면 `work` target으로 다시 snap하도록 보정했습니다.
  - 사용자가 1000ms 입력 차단도 효과가 없다고 확인해, 마지막 career point 입력 차단 방식은 제거했습니다.
  - 실제 원인은 직전 section snap의 `lockedUntil`이 남아 있을 때 자동 경계 보정도 `snapToTarget()`의 early return에 막히는 경로로 보고, career -> work overshoot 보정에 한해서 lock을 우회하는 `force` option을 추가했습니다.

### 검증
- `git diff --check` 통과
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints

## 2026-05-20 Remote D1 link cleanup and admin drawer state split

### 요구사항
- 로컬 D1에서는 삭제했지만 배포 D1에는 남아 있는 admin profile link 중 `test`로 시작하는 메일 링크만 원격 D1에서 삭제합니다.
- 모바일 admin drawer 구현이 데스크톱 admin 레이아웃과 충돌해 화면이 이상해지는 문제를 수정합니다.
- 코드 수정은 worker 에이전트가 맡고, explorer 에이전트가 리뷰합니다.

### 구현
- 원격 D1 데이터 정리
  - `npx wrangler d1 execute DB --remote`로 production D1 binding `DB`에 접근했습니다.
  - `profile.links` JSON 배열에서 `label`이 `test%`이고 `url`이 `mailto:%`인 항목만 제거했습니다.
  - 삭제 전 링크는 `hampenta@icloud.com`, `010 2672 1912`, `서울특별시, 강서구`, `test1` 4개였고, 삭제 후에는 앞의 3개만 남았습니다.
  - 참고: `portfolio-db` 이름으로 remote query를 처음 시도했을 때 Cloudflare API 7403 권한 오류가 났지만, wrangler binding 이름 `DB`로 실행하면 정상 동작했습니다.
- `src/components/admin/AdminApp.tsx`
  - 데스크톱 sidebar collapse 상태(`sidebarCollapsed`)와 모바일 drawer 상태(`isMobileAdmin`, `mobileDrawerOpen`)를 분리했습니다.
  - `.admin-drawer-overlay`는 모바일이고 drawer가 열린 상태에서만 DOM에 렌더링됩니다.
  - 모바일 hamburger도 모바일 상태에서만 렌더링되며, 데스크톱 grid 레이아웃에는 영향을 주지 않습니다.
- `src/styles/admin.css`
  - `.admin-hamburger` 기본값을 `display: none`으로 두고, 모바일 media query 안에서만 보이게 했습니다.
  - 모바일 drawer 표시 상태를 `.is-mobile-drawer-open`으로 분리했습니다.
  - 기존 `.is-sidebar-collapsed`와 모바일 drawer reset selector가 섞이던 부분을 정리하고 `!important` 의존을 줄였습니다.

### 검증
- Worker 에이전트가 `git diff --check`와 `npm run build` 통과를 확인했습니다.
- Explorer 에이전트가 수정 범위를 리뷰했고 findings 없음으로 확인했습니다.
- 메인 세션에서 `git diff --check` 통과를 재확인했습니다.
- 메인 세션에서 `npm run build` 재확인:
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서는 `astro check` 0 errors / 0 warnings / 0 hints, build complete 확인했습니다.

## 2026-05-20 Admin mobile drawer UI, Links editor & Works editor improvements

### 요구사항
- 관리자(admin) 페이지 자기소개 수정 Links 부분의 test 항목 및 불필요한 삭제(×)/추가 버튼을 제거합니다.
- 관리자 페이지 모바일 뷰포트에서 상단바와 메뉴 아이콘 등 어색하게 들어간 UI 개선을 위해 C안(슬라이딩 드로어 메뉴형)을 적용합니다.
- 작품 에디터(Works Editor) 화면의 UI 사용성을 전반적으로 개선합니다. (상단 타이틀 잘림 방지, 햄버거 메뉴 숨김, 콤팩트한 카테고리 알약 크기 복원, 중간에 위치한 Save 버튼을 상단 탑바로 통합 및 하단 노출 숨김)

### 구현 및 수정 내용
- **자기소개 링크 편집 간소화 및 D1 데이터 정리 (`src/components/admin/AdminApp.tsx`):**
  - 로컬 DB `profile` 테이블에서 불필요한 test 링크 데이터를 수동 쿼리로 제거 완료했습니다.
  - CRUD 삭제(×) 및 추가 버튼이 현재 기획상 필요치 않다는 피드백에 따라 UI에서 완전히 덜어냈습니다.
  - 모바일(660px 이하)에서 아이콘과 함께 이메일/링크 주소가 상하로 예쁘게 감싸지도록 2열 반응형 그리드(`.link-fields` grid-template-columns: 42px 1fr)로 간소화했습니다.
- **모바일 드로어 뷰 및 인터랙션 구현 (`src/components/admin/AdminApp.tsx`):**
  - 화면 너비가 980px 이하일 때, 모바일 드로어가 닫힌 상태(`sidebarCollapsed = true`)로 최초 로드되도록 `useEffect` 감지 로직을 추가했습니다.
  - 모바일 탑바에 ☰ (햄버거) 토글 버튼을 얹어 메뉴 상태(`sidebarCollapsed`)와 연동시켰습니다.
  - 드로어 오픈 상태에서 뒷배경을 어둡고 흐리게 덮어주는 반투명 글래스모피즘 오버레이 배경(`.admin-drawer-overlay`)을 바인딩했습니다.
- **작품 에디터 상단바 및 타이틀 개선 (`src/components/admin/AdminApp.tsx`, `src/styles/admin.css`):**
  - 에디터 화면(`workScreen === "editor"`)에서는 모바일 상단바의 ☰ 햄버거 토글 버튼을 숨겨 뒤로가기(←) 화살표 하나만 노출하도록 JSX 조건처리를 추가해 공간을 대폭 확보했습니다.
  - 모바일(980px 이하)에서 탑바 내부의 "View site" 외부 링크를 `display: none`으로 비활성화하여 저장을 위한 공간을 넓혔습니다.
  - `.admin-title-block`, `.admin-title-row`에 `min-width: 0`을 지정하고 `h2` 요소에 `text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`을 적용해 타이틀이 아무리 길어도 상단 액션 버튼들과 겹쳐서 깨지지 않고 한 줄로 단정히 줄임표 처리되도록 보완했습니다.
- **작품 에디터 폼 필드 및 저장 위치 최적화 (`src/components/admin/AdminApp.tsx`, `src/styles/admin.css`):**
  - 에디터 하단의 sticky-actions에 있던 `Save work` 버튼이 모바일에서 에디터 필드 아래 및 라이브 프리뷰 위에 끼여 중간에 뜬금없이 위치하던 사용성 문제를 파악하고, 모바일 980px 이하에서 `.work-editor-actions .primary-action`을 `display: none`으로 비활성화했습니다.
  - 대신 상단 탑바 액션에 항시 노출되는 주황색 `Save` 버튼을 추가하여, 스크롤을 무한히 내리지 않아도 편집 중 언제든 즉각 저장할 수 있도록 최상위 접근성을 보장했습니다.
  - 모바일 660px 이하 해상도에서 폼 필드를 100% 폭으로 정렬하던 `.field-grid label` 스타일을 직계 자식만을 지정하는 `.field-grid > label`로 교정하여, nested label 구조인 카테고리 체크박스 pill 버튼(UI/UX, BI/BX 등)들이 100% 가로로 뚱뚱하게 늘어나던 현상을 복구했습니다.

### 검증 결과
- 모바일 해상도(390x844) 상태의 `/admin` 페이지에서 테스트용 서브에이전트가 검증을 성공적으로 마쳤습니다.
  - 햄버거 메뉴를 탭할 때 드로어가 우아하게 등장하고, 뒷배경 오버레이 탭 시 드로어가 자동으로 감춰지는 전환 플로우를 기록했습니다.
  - 모바일 상단바 타이틀이 ellipsis로 축약되고 옆에 Save가 배치된 모습, 콤팩트한 둥근 알약 모양으로 복구된 카테고리 체크 박스, 하단 Save 버튼 숨김 및 오직 Delete 버튼만 보이는 깔끔한 에디터 인터페이스를 검증 완료했습니다.
  - **검증 스크린샷 및 영상:**
    - 드로어 닫힘: [admin_mobile_drawer_closed.png](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/admin_mobile_drawer_closed.png)
    - 드로어 열림: [admin_mobile_drawer_open.png](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/admin_mobile_drawer_open.png)
    - 에디터 모바일 탑바: [work_editor_mobile_topbar_fixed.png](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/work_editor_mobile_topbar_fixed.png)
    - 에디터 카테고리 알약: [work_editor_mobile_basic_info_fixed.png](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/work_editor_mobile_basic_info_fixed.png)
    - 에디터 하단 액션: [work_editor_mobile_buttons_fixed.png](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/work_editor_mobile_buttons_fixed.png)
    - 에디터 데스크톱 전체: [work_editor_desktop_fixed.png](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/work_editor_desktop_fixed.png)
    - 모바일 검증 레코딩: [work_editor_mobile_fixed.webm](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/work_editor_mobile_fixed.webm)

## 2026-05-20 Safari physical mouse wheel, Mobile scroll & Career-to-Work transition locks

### 요구사항
- Safari/WebKit 환경에서 마우스 휠 스크롤이 작동하지 않는 현상(터치패드만 작동)을 수정하고 모바일 웹 환경의 전반적인 스크롤 동작과 뒤로가기 시 스크롤 복원 동작을 검증합니다.
- Career의 마지막 부분에서 Work 섹션으로 전환될 때, 마우스 휠 한 틱만 굴려도 과도하게 빠르게 넘어가거나, 전환 직후 유입되는 관성 스크롤(Inertia)로 인해 Work 섹션의 위치가 딱 들어맞지 않고 어긋나는 현상을 해결합니다.

### 구현 및 수정 내용
- `src/styles/global.css`
  - WebKit(Safari) 환경에서 `::-webkit-scrollbar`를 임의로 조작하거나 `overscroll-behavior-y: contain` 속성을 사용할 때, 일반 물리 마우스 휠(Physical Mouse Wheel)의 네이티브 스크롤이 완전히 무시되는 WebKit 고유 버그를 해결하기 위해 스크롤바 조작 코드와 `overscroll-behavior-y: contain` 선언을 **완전히 제거**했습니다.
- `src/components/HomePage.astro`
  - **프로그래매틱 스크롤 직후 위치 보정 해결:** `updateScrollTriggersAfterProgrammaticScroll()` 함수에서 모든 브라우저를 대상으로 programmatic scroll 직후에는 `ScrollTrigger.refresh()` 대신 `ScrollTrigger.update()`만 호출하도록 수정해 50~100px 튕김 현상을 유발하는 강제 레이아웃 계산을 제거했습니다.
  - **이중 스크롤 락 및 경계 차단 구현:**
    - `isCareerItemInputLocked()` 함수가 기존에 경계를 벗어나는 순간 즉시 무력화되던 버그를 고쳤습니다. 이제 스크롤 위치가 identity 섹션 부근(`[getIdentityTop() - 100, getWorkTop() + 100]`)에 있는 동안은 카드가 전환된 직후 360ms 동안 스크롤 입력을 완전히 잠급니다.
    - 경계를 이탈해 작품으로 스냅하는 `crossedCareerToWork` 조건식에도 `Date.now() >= lockedUntil && Date.now() >= careerItemLockedUntil` 조건을 추가하여, 마지막 카드가 켜진 직후 360ms의 락 타임 동안 한 틱의 휠 입력만으로 조기 이탈하는 문제를 철저히 예방했습니다.
  - **관성 필터링용 Post-completion Lock 도입:**
    - `snapCareerWorkCover`, `snapIntroAboutCover`, `snapToTarget` 등 모든 스냅 애니메이션의 `onComplete` 시점에 `lockedUntil = Date.now() + 240;` 을 지정했습니다.
    - 애니메이션 완성 직후 240ms 동안 입력 잠금을 걸어, 사용자의 이전 드래그/휠 제스처에서 발생한 잔여 관성 스크롤(Inertia)이 유입되어 스냅 타겟(Work 섹션 등)의 위치를 미세하게 어긋나게 만드는 버그를 완전히 차단했습니다.

### 검증 결과
- 모바일 뷰포트 및 데스크톱 Chrome 환경에서 검증 시나리오를 통과했습니다. (녹화본 경로: [scroll_transition_fix.webm](file:///Users/sihyeon/.gemini/antigravity/brain/4deba52f-c0d2-4360-8d3c-f8c39a9520df/scroll_transition_fix.webm))
  - **이탈 및 락 동작:** 커리어 마지막 카드가 활성화된 직후 마우스를 재차 스크롤해도 360ms 동안 정지 상태를 유지하여 정보를 충분히 보여줍니다.
  - **작품 정렬:** 락 해제 후 스크롤을 내리면 작품 섹션의 시작 위치(`scrollY: 2440` 등 offsetTop과 완전 일치)에 자석처럼 완벽히 밀착하여 정렬되며 관성 밀림 현상이 전혀 없습니다.
  - **뒤로가기 복원:** 일반 갤러리 카드 및 Featured 카드의 상세 페이지 진입 후 브라우저 뒤로가기 시 기존 목록의 스크롤 위치가 오차 없이 복원됩니다.
  - **뒤로가기 복원:** 일반 갤러리 카드 및 Featured 카드의 상세 페이지 진입 후 브라우저 뒤로가기(또는 상단 목록 버튼)를 실행했을 때 기존 목록의 스크롤 위치가 정확하게 복원됩니다.
  - **레이아웃:** 모바일 뷰포트에서 가로 스크롤(Horizontal overflow)이 발생하지 않는 구조적 안정성을 확인했습니다.

## 2026-05-19 Mobile scroll audit handoff

### 요구사항
- Safari/Chrome 구분 없이 모바일 스크롤 로직을 검수하고 자기검증합니다.
- 필요하면 설치된 Chrome 확장/브라우저 환경을 활용해 직접 확인합니다.

### 검수 내용
- `src/components/HomePage.astro`
  - Safari/iOS WebKit에서는 `ScrollTrigger.observe({ preventDefault: true })`를 쓰지 않고 native wheel/touch fallback으로 처리하는 현재 분기를 확인했습니다.
  - gallery/free-scroll 범위에서는 observer가 비활성화되고, snap boundary에서만 다시 section 전환이 걸리는 구조를 확인했습니다.
  - `/work` history back/forward 복귀 시 기존 scrollY가 있으면 초기 gallery top 강제 이동을 건너뛰는 guard를 확인했습니다.
  - floating top button은 GSAP `overwrite: true`, snap observer disable, temporary `scrollSnapType = "none"` 복구 흐름을 유지하고 있습니다.
- `src/styles/global.css`
  - 모바일 detail에서 `.work-hero`와 `.work-meta`가 세로로 쌓이도록 조정한 상태입니다.
  - 모바일 viewport 높이는 `100dvh` 지원 환경에서 `--snap-viewport-height`를 따라가도록 되어 있습니다.

### 직접 확인
- Chrome DevTools device toolbar에서 iPhone 14 Pro Max, 430 x 932 환경으로 확인했습니다.
- 확인 흐름:
  - intro -> about cover 전환 정상
  - about -> career 진입 정상
  - career timeline point가 순차적으로 이동하는 것 확인
  - career -> work cover 전환 정상
  - work intro -> featured work 3개 카드 순차 이동 정상
  - featured -> gallery 진입 후 `is-free-scroll` 상태에서 native gallery scroll 정상
  - gallery 위쪽 boundary에서 featured로 되돌아가는 흐름 확인
  - featured의 `Orbit Brand`에서 detail 진입 후 브라우저 뒤로가기로 같은 featured 카드 위치에 복귀하는 것 확인
  - mobile detail에서 hero copy와 meta가 세로 배치로 보이는 것 확인

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints
- `git diff --check` 통과

### 다음 작업 주의
- Chrome mobile emulation으로는 실제 iOS Safari의 하단 주소창 collapse/expand를 완전히 재현할 수 없습니다. 해당 증상이 다시 나오면 실제 iPhone Safari 또는 Safari Web Inspector 기준으로 추가 확인이 필요합니다.
- 현재 커밋 전 변경 파일은 `HISTORY.md`, `src/styles/global.css`입니다.

## 2026-05-19 Mobile work detail hero/meta stack

### 요구사항
- 모바일에서 작업물 detail 페이지에 들어가면 hero copy와 work meta가 좌우 정렬로 보여 읽기 어렵기 때문에 세로 배치로 변경합니다.

### 구현
- `src/styles/global.css`
  - `@media (max-width: 760px)`에서 `.work-hero`를 1열 grid로 전환했습니다.
  - `.work-meta`가 hero copy 아래에 전체 폭으로 이어지도록 폭/간격을 보정했습니다.
  - 첫 meta row에도 상단 구분선을 넣어 본문과 메타 정보가 모바일에서 자연스럽게 분리되도록 했습니다.

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints
- `git diff --check` 통과

## 2026-05-19 Career/Work cover transition

### 요구사항
- career에서 work intro로 넘어갈 때도 기존 슬라이드 전환이 아니라, work 섹션이 career 위에 덮이는 방식으로 전환합니다.
- 반대로 work intro에서 career로 올라갈 때는 work cover가 치워지며 career가 드러나야 합니다.

### 구현
- `src/components/HomePage.astro`
  - `snapCareerWorkCover()`를 추가해 career ↔ work boundary에서만 별도 cover transition을 실행합니다.
  - career → work에서는 현재 career stage를 fixed underlay 복제본으로 깔고, work intro 복제본을 아래에서 위로 올려 덮습니다.
  - work → career에서는 work intro 복제본을 화면 위에 둔 상태로 실제 스크롤 위치를 career로 복원한 뒤, work cover를 아래로 내리며 치웁니다.
  - 실제 `#work` 섹션을 fixed로 바꾸지 않고 복제본만 움직여서, 전환 중 문서 높이와 snap offset이 흔들리지 않게 했습니다.
  - career underlay는 부모 `.identity-section`의 `is-career`/`is-career-list` 상태를 잃지 않도록 복제본에 같은 상태 클래스를 붙입니다.
- `src/styles/global.css`
  - `.career-work-cover-underlay`와 `.work-cover-panel` fixed layer 스타일을 추가했습니다.
  - 원본 `.identity-stage`, `.work-intro-section`의 position 규칙에 덮이지 않도록 cover selector 명시도를 높였습니다.
  - `.career-work-cover-underlay.is-career` 상태에서도 timeline heading, profile intro/contact/media, 모바일 timeline visibility가 원본 career 상태와 동일하게 보이도록 selector를 추가했습니다.

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints
- `git diff --check` 통과

## 2026-05-19 Safari work back scroll restoration

### 요구사항
- Safari에서 `/work` gallery/featured 위치에서 작업물 detail로 들어갔다가 뒤로가기를 하면, 처음에는 이전 클릭 위치로 돌아오는 듯하다가 잠시 후 위쪽으로 스크롤이 올라가는 문제를 수정합니다.

### 구현
- `src/components/HomePage.astro`
  - `/work` route는 shared `HomePage`를 `initialSection="work"`로 열면서 120ms 뒤 gallery top으로 강제 이동하는 초기화가 있습니다.
  - Safari의 history scroll restoration이 먼저 이전 클릭 위치를 복원한 뒤, 이 초기화가 다시 gallery top으로 보내면서 점프가 발생하는 구조였습니다.
  - `performance.getEntriesByType("navigation")[0].type === "back_forward"`인 history traversal에서, 이미 `window.scrollY > 0`으로 복원된 상태라면 `/work` 초기 강제 스크롤을 건너뛰고 `is-free-scroll` 상태만 맞추도록 변경했습니다.
  - 직접 `/work`로 진입하거나 복원된 scrollY가 없는 경우에는 기존처럼 gallery top으로 이동합니다.

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints
- `git diff --check` 통과

## 2026-05-19 Intro/About cover transition

### 요구사항
- intro에서 about으로 넘어갈 때 기존의 일반 스크롤 슬라이드처럼 밀리는 전환이 아니라, about 섹션이 intro 위를 덮는 방식으로 보이게 수정합니다.
- about에서 intro로 올라갈 때는 덮였던 about 패널이 아래로 치워지며 intro가 드러나는 반대 방향 전환으로 동작해야 합니다.

### 구현
- `src/components/HomePage.astro`
  - `snapToTarget()` 안에서 intro ↔ about 이동만 별도 `snapIntroAboutCover()` 경로로 처리했습니다.
  - intro는 실제 레이아웃을 고정시키지 않고 복제한 fixed underlay를 만들어 배경에 깔아, 문서 흐름과 offset 계산이 흔들리지 않게 했습니다.
  - 실제 `.identity-stage`를 fixed cover panel로 올린 뒤 `yPercent`를 GSAP으로 제어해 intro → about은 아래에서 위로 덮고, about → intro는 아래로 빠지며 치워지게 했습니다.
  - 전환 완료 후에는 fixed class, transform, 복제 underlay를 모두 정리하고 기존 ScrollTrigger/snap 상태 동기화를 호출합니다.
- `src/styles/global.css`
  - `.intro-cover-underlay`와 `.identity-stage.is-cover-panel` fixed layer 스타일을 추가했습니다.

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints
- `git diff --check` 통과

## 2026-05-19 Mobile Safari dynamic viewport height

### 요구사항
- 모바일 Safari에서 스크롤 후 하단 주소창이 내려가 viewport가 커졌을 때, full-screen 섹션이 여전히 작은 `svh` 기준으로 남아 하단 주소창 영역만큼 검정 배경이 보이는 문제를 수정합니다.

### 구현
- `src/styles/global.css`
  - `--snap-panel-height` 계산 기준을 `--snap-viewport-height` 변수로 분리했습니다.
  - 기본값은 기존처럼 `100svh`를 유지합니다.
  - `@supports (height: 100dvh)`와 `@media (max-width: 1180px)` 조건에서만 `--snap-viewport-height: 100dvh`를 적용해 모바일/태블릿 레이아웃이 Safari 주소창 collapse 후 실제 viewport 높이를 따라가게 했습니다.
  - `--snap-panel-offset`은 `--snap-panel-height`의 음수값으로 계산해 featured sticky offset도 같은 높이 기준을 쓰게 했습니다.
  - `.profile-media img`의 min-height도 `100svh` 고정값 대신 `--snap-panel-height`를 따르게 했습니다.

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints

## 2026-05-19 Safari physical mouse wheel fix

### 요구사항
- 직전 Codex 에이전트가 Safari/WebKit scroll guard를 수정해 `/work` 자동 스크롤(튕김) 현상은 해결했으나, 여전히 about → career 이후 물리 마우스 휠 스크롤이 작동하지 않는 현상(터치패드만 작동)이 남아있어 이를 수정합니다.

### 구현
- `src/styles/global.css`
  - WebKit(Safari) 환경에서 `::-webkit-scrollbar`를 조작하거나 `overscroll-behavior-y: contain`을 지정하면, 터치패드는 정상 작동하지만 일반 물리 마우스 휠(Physical Mouse Wheel)의 네이티브 스크롤이 무시되거나 오작동하는 버그가 있습니다.
  - 1px 꼼수로 우회하려 했으나 Safari의 버전 파편화로 인해 완벽하게 해결되지 않아, 문제가 되는 `.home-scroll:not(.is-free-scroll)::-webkit-scrollbar` 관련 블록과 `overscroll-behavior-y: contain` 선언을 **완전히 제거**했습니다.
  - 최신 브라우저들은 표준 속성인 `scrollbar-width: none;`만으로도 스크롤바가 숨겨지며 마우스 휠을 차단하지 않습니다.

### 검증
- `npm run build` 및 `git diff --check` 통과 확인 예정

## 2026-05-19 Safari/WebKit home scroll guard

### 요구사항
- Safari 엔진에서만 home scroll이 꼬이는 현상을 수정합니다.
  - Mac Safari 마우스 휠에서는 about -> career 이후 timeline point 스크롤이 진행되지 않습니다.
  - Safari 터치패드/iPhone Safari에서는 `/work`까지 이동한 뒤 불규칙하게 위로 되감기는 현상이 있습니다.
- 직전 floating top button 지연 표시 수정은 원인과 다르므로 롤백합니다.

### 구현
- `src/layouts/PublicLayout.astro`
  - floating top button 표시/클릭 로직을 이전 즉시 표시 방식으로 되돌렸습니다.
- `src/components/HomePage.astro`
  - Safari/iOS WebKit에서는 `ScrollTrigger.observe({ preventDefault: true })`를 생성하지 않고, 기존 native `wheel`/`touchmove` fallback만으로 snap 입력을 처리하도록 분기했습니다.
  - Safari/WebKit에서는 programmatic scroll 이후 `ScrollTrigger.refresh()` 대신 `ScrollTrigger.update()`만 호출해 sticky/svh 레이아웃 재계산으로 인한 scroll 위치 보정을 피합니다.
  - Safari/WebKit에서는 career native scroll range에서 `careerItemLockedUntil`이 wheel/touch 입력을 막지 않게 했습니다.
  - home scroll `syncSnapObserver`의 자동 boundary snap 조건이 gallery/free-scroll 범위에서는 실행되지 않도록 `canAutoBoundarySnap = !freeScroll && ...` 가드를 추가했습니다.
  - `career -> work` 자동 snap은 실제 career/work 경계 사이에서만 작동하도록 `currentY < getWorkTop() - snapTolerance` 상한을 추가했습니다.
  - `about -> careerEntry` 자동 snap도 실제 careerEntry/careerExit 사이에서만 작동하도록 범위를 좁혔습니다.

### 검증
- `npm run build` 통과, 0 errors / 0 warnings / 0 hints

## 2026-05-18 Mobile career timeline pacing

### 요구사항
- 모바일 career에서 timeline point들이 한 번에 빠르게 지나가는 느낌을 줄이고, 데스크톱처럼 항목이 하나씩 이동하는 체감으로 조정합니다.

### 구현
- `src/components/HomePage.astro`
  - 모바일 identity travel 높이를 `mobileIdentityTravelSvh`로 별도 계산해 1180px 이하에서 더 긴 scroll range를 확보했습니다.
  - 모바일 timeline active progress는 career intro 시작점이 아니라 timeline list가 실제로 보이는 `careerListStartProgress`부터 0으로 시작하도록 분리했습니다.
  - 이에 따라 리스트가 보이기 전에 point가 미리 넘어가는 문제를 줄였습니다.
- `src/styles/global.css`
  - `.identity-section` 기본 높이를 `--identity-travel` 변수로 받고, 1180px 이하에서는 `--identity-mobile-travel`을 사용하도록 변경했습니다.

### 검증
- `npm run build` 통과

## 2026-05-18 Identity mobile breakpoint unification

### 요구사항
- 1180px 미만에서 about/career가 어색한 세로 배치로 전환되는 문제를 없애고, 이 구간도 모바일형 배경 이미지 레이아웃으로 통합합니다.

### 구현
- `src/components/HomePage.astro`
  - `mobileIdentityQuery` 기준을 `max-width: 760px`에서 `max-width: 1180px`로 변경했습니다.
  - 이에 따라 1180px 이하에서는 career intro 단계와 career list 단계가 모바일형으로 분리됩니다.
- `src/styles/global.css`
  - 기존 `@media (max-width: 1180px)`의 중간 세로 배치 규칙을 제거하고, identity 모바일 배경 이미지 레이아웃을 이 breakpoint로 이동했습니다.
  - `@media (max-width: 760px)`에는 작은 화면 보정과 work/gallery 관련 compact 스타일만 남겼습니다.

### 검증
- `npm run build` 통과

## 2026-05-18 Revert profile media CSS variable cleanup

### 요구사항
- 모바일 profile media의 `!important` 제거를 위해 CSS variable 중심으로 정리했으나, home scroll/career background 상태가 기존 GSAP 제어 방식에 의존해 스크롤 전환과 데스크톱 career 배경 밝기가 흔들렸습니다.
- 안정적으로 동작하던 GSAP 기반 profile media 제어로 되돌립니다.

### 구현
- `src/components/HomePage.astro`
  - `profileMedia`는 다시 GSAP `autoAlpha`, `scale`, `filter` inline 제어를 사용합니다.
  - 등장 blur만 모바일 CSS와 합성하기 위해 `--profile-media-enter-blur` 변수는 유지합니다.
- `src/styles/global.css`
  - 데스크톱 career profile background는 다시 `opacity: 0.16 !important`, `grayscale(1) contrast(1.1) blur(2px)` 조합으로 복구했습니다.
  - 모바일 profile background는 GSAP inline filter를 이겨야 하므로 `!important`를 유지합니다.

### 검증
- `npm run build` 통과

## 2026-05-18 Profile image blur entrance

### 요구사항
- About 진입 시 프로필 사진이 열리는 듯한 clip reveal보다 blur로 자연스럽게 뜨도록 변경합니다.

### 구현
- `src/components/HomePage.astro`
  - `profileMedia` 초기 상태를 clip reveal 대신 `autoAlpha: 0`, `blur(18px)`, 약한 scale 상태로 두고, about intro에서 opacity/blur/scale로 등장하게 바꿨습니다.
  - 모바일에서는 CSS filter가 `!important`로 배경 밝기를 유지하므로 `--profile-media-enter-blur` CSS 변수를 같이 애니메이션합니다.
- `src/styles/global.css`
  - 모바일 profile background filter에 `var(--profile-media-enter-blur)`를 합성해 모바일에서도 blur entrance가 보이게 했습니다.

### 검증
- `npm run build` 통과

## 2026-05-18 Mobile about/career layout split

### 요구사항
- PC/mobile 2가지 레이아웃을 유지하면서 모바일 about/career 표현을 다시 잡습니다.
- 모바일 about에서는 프로필 이미지를 어둡게 처리한 배경 이미지로 깔고, 텍스트는 흰색으로 올립니다.
- 모바일 career는 같은 배경 이미지 위에서 2단계로 나눕니다.
  - 첫 단계: career 소개 문구만 표시
  - 다음 스크롤 단계: timeline 이력만 full로 표시

### 구현
- `src/components/HomePage.astro`
  - `max-width: 760px` media query 상태를 JS에서 감지해 mobile identity layout 여부를 판단합니다.
  - `is-career-list` 클래스를 추가해 career intro 단계와 career list 단계를 분리했습니다.
  - PC에서는 기존처럼 career 진입 시 copy와 timeline을 함께 노출하고, 모바일에서만 timeline 노출 시점을 뒤로 미뤘습니다.
- `src/styles/global.css`
  - 모바일에서 `.identity-side`/`.profile-media`를 stage 전체 배경 레이어로 전환했습니다.
  - about/career copy를 흰색 텍스트로 바꾸고, profile image에는 어두운 overlay와 brightness/filter를 적용했습니다.
  - 모바일 career list 단계에서는 copy panel을 숨기고 `.timeline-items`만 같은 배경 위에 표시되게 했습니다.
  - 모바일 sticky stage는 `overflow: hidden`으로 닫아 좁은 세로 화면에서 아래 섹션이 비치지 않도록 했습니다.

### 검증
- `npm run build` 통과

## 2026-05-18 Featured work readability blur

### 요구사항
- Featured work 썸네일 위 텍스트 시인성을 높이기 위해 좌상단에서 우하단으로 흐르는 gradient blur를 추가합니다.
- 모바일에서는 상단 텍스트 영역이 더 잘 보이도록 blur mask 각도와 범위를 다르게 적용합니다.

### 구현
- `src/styles/global.css`
  - `.featured-work .work-visual::after`에 masked `backdrop-filter` 레이어를 추가했습니다.
  - 기존 featured panel 전환용 `.featured-link::before` blur와 overlay gradient는 그대로 유지했습니다.
  - `max-width: 760px`에서는 더 세로 방향에 가까운 mask를 적용해 모바일 상단 copy 뒤쪽 blur 영역을 넓혔습니다.

### 검증
- `npm run build` 통과

## 2026-05-18 Remote D1/R2 to local sync

### 요구사항
- 배포 사이트에서 쓰는 Cloudflare D1과 R2 데이터를 현재 로컬 개발 환경으로 동기화해 dev 서버와 퍼블리싱 상태를 맞춥니다.

### 구현
- Cloudflare Wrangler OAuth session이 만료되어 `npx wrangler login`으로 다시 로그인했습니다.
- `npx wrangler d1 export portfolio-db --local --output d1-backups/local-before-sync-2026-05-18.sql --skip-confirmation`
  - 기존 local D1을 먼저 백업했습니다.
- `npx wrangler d1 export portfolio-db --remote --output d1-backups/remote-prod-2026-05-18.sql --skip-confirmation`
  - remote D1 production dump를 받았습니다.
- `d1-backups/reset-local-before-import-2026-05-18.sql`
  - local D1의 기존 테이블을 drop하는 reset SQL을 만들었습니다.
- `npx wrangler d1 execute portfolio-db --local --file d1-backups/reset-local-before-import-2026-05-18.sql --yes`
  - local D1 테이블을 초기화했습니다.
- `npx wrangler d1 execute portfolio-db --local --file d1-backups/remote-prod-2026-05-18.sql --yes`
  - remote D1 dump를 local D1에 import했습니다.
- `d1-backups/sync-r2-from-d1-export-2026-05-18.mjs`
  - remote D1 dump의 `assets.r2_key` 값을 기준으로 R2 object 30개를 remote `portfolio-media`에서 내려받고 local `portfolio-media`에 업로드했습니다.
  - 다운로드 백업은 `r2-backups/remote-prod-2026-05-18/`에 남겼습니다.

### 검증
- import 후 local D1 주요 row count:
  - `assets`: 30
  - `works`: 7
  - `timeline_items`: 5
  - `work_blocks`: 0
  - `d1_migrations`: 4
- local R2 sample object 확인:
  - `uploads/2026/05/35a1acf4-035f-421c-9513-d9427197e099-poster-sdr.png`
  - `/private/tmp/r2-sync-check-poster.png`로 다운로드 성공, 파일 크기 1.5M

### 주의
- Wrangler `r2 object` 명령에는 전체 object list 기능이 없어 D1 `assets` 테이블에 기록된 R2 key만 동기화했습니다.
- D1에서 참조하지 않는 orphan R2 object가 있으면 이번 동기화에는 포함되지 않습니다.
- `d1-backups/`와 `r2-backups/`는 로컬 백업/동기화 산출물입니다.

## 2026-05-14 Remote D1 to local D1 sync

### 요구사항
- 배포 사이트에서 쓰는 remote D1 DB 내용을 현재 로컬 개발 D1과 동기화합니다.

### 구현
- `npx wrangler d1 export portfolio-db --local --output d1-backups/local-before-sync-2026-05-14.sql --skip-confirmation`
  - 기존 로컬 D1을 먼저 SQL로 백업했습니다.
- `npx wrangler d1 export portfolio-db --remote --output d1-backups/remote-prod-2026-05-14.sql --skip-confirmation`
  - Cloudflare remote D1을 SQL로 export했습니다.
- `d1-backups/reset-local-before-import-2026-05-14.sql`
  - local D1의 기존 테이블을 drop하는 reset SQL을 만들었습니다.
- `npx wrangler d1 execute portfolio-db --local --file d1-backups/reset-local-before-import-2026-05-14.sql --yes`
  - local D1 테이블을 초기화했습니다.
- `npx wrangler d1 execute portfolio-db --local --file d1-backups/remote-prod-2026-05-14.sql --yes`
  - remote D1 dump를 local D1에 import했습니다.

### 검증
- import 후 local D1 주요 row count:
  - `assets`: 30
  - `works`: 7
  - `timeline_items`: 5
  - `work_blocks`: 0
  - `d1_migrations`: 4

### 주의
- 이 동기화는 D1 metadata/data만 복사합니다. R2의 실제 이미지 바이너리는 별도 저장소라 필요 시 따로 동기화해야 합니다.
- `d1-backups/`는 로컬 백업/덤프용 untracked 폴더입니다.

## 2026-05-14 About intro paragraph gap

### 요구사항
- Main about intro에서 `함시현입니다.` 문단과 `주어진 답...설계합니다.` 문단 사이에 여백을 추가합니다.
- margin과 `<br>`를 같이 써서 적용합니다.
- 후속 조정: `<br>`가 한 줄 높이를 추가해 여백이 과해졌으므로, 작은 margin만 남겨 reference 수준으로 줄입니다.

### 구현
- `src/components/HomePage.astro`
  - 최초에는 `profile.intro` HTML에서 `주어진 답`으로 시작하는 문단 앞에 `<br class="profile-intro-break" />`를 삽입했지만, 여백이 과해져 원래 `profile.intro` 렌더로 되돌렸습니다.
- `src/styles/global.css`
  - `.profile-intro p:nth-of-type(3)`에 responsive `margin-top`을 지정해 세 번째 문단 위에만 작은 여백을 줬습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Admin slug/link input fixes and contact icons

### 요구사항
- Works editor의 slug input에서 hyphen을 직접 입력할 수 있게 합니다.
- Profile links의 click action input에서 한 글자 입력 후 focus가 빠지는 문제를 고칩니다.
- About contact icon을 admin links에서 사용한 inline icon 스타일로 맞추고, 색상은 텍스트 색과 통일합니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - slug input에는 입력 중 trailing hyphen을 보존하는 `sanitizeSlugInput`을 사용하고, blur 시에만 기존 `slugify`로 최종 정리하도록 분리했습니다.
  - Profile links row key를 URL 값 기반에서 index 기반 stable key로 바꿔 URL 입력 시 input이 remount되지 않게 했습니다.
- `src/components/HomePage.astro`, `src/styles/global.css`
  - About contact의 기존 이미지 SVG를 inline SVG로 대체했습니다.
  - `.profile-contact svg`가 `stroke: currentColor`를 쓰도록 해 텍스트 색과 아이콘 색을 통일했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Admin timeline bulk save

### 요구사항
- Career 이력 관리에서 item별 Save 버튼을 없애고 일괄 저장으로 바꿉니다.
- 개별 Delete 버튼은 각 career card에 그대로 둡니다.
- 일괄 저장 버튼은 자기소개 관리 하단 Save 버튼과 같은 위치/스타일로 맞춥니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - `saveTimelineItem`을 `saveTimeline`으로 바꾸고, 현재 timeline state의 모든 item을 순차적으로 `/api/admin/timeline/:id`에 `PUT`하도록 했습니다.
  - 각 timeline card의 개별 Save 버튼을 제거하고 Delete만 남겼습니다.
  - `Save career` 버튼을 timeline section 하단 `.action-row.sticky-actions`에 배치해 profile save button과 동일한 UX로 맞췄습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Admin work editor back button

### 요구사항
- Works editor 화면의 기존 우측 `Work list` 버튼을 제거하고, 제목 왼쪽에 게시글 상세 상단바와 비슷한 뒤로가기 화살표 버튼을 둡니다.
- 버튼은 기존 Work list 이동 로직을 그대로 사용해 저장하지 않은 변경사항 확인 흐름을 유지합니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - `.admin-topbar` 제목 영역에 `.admin-title-row`를 추가하고, works editor 상태일 때만 `←` 버튼을 표시합니다.
  - 기존 `.admin-topbar-actions`의 `Work list` 버튼은 제거했습니다.
- `src/styles/admin.css`
  - `.admin-title-back`을 투명 배경의 원형 arrow button으로 스타일링하고 hover/focus 시 admin accent 색으로 반응하게 했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Admin editor drag/category/profile polish

### 요구사항
- Works editor 본문 블록 순서 변경 시 드래그 중인 블록이 앞뒤로 흔들리는 불안정함을 줄입니다.
- Works category checkbox 디자인을 개선하고, `UI/UX`와 `BI/BX` 중복 선택 값이 public 게시글에도 표시되도록 합니다.
- Career timeline public/admin 화면에서 description을 사용하지 않습니다.
- Work detail 가로 스크롤 막대와 CSS 인코딩 깨짐 가능성을 줄입니다.
- Admin profile에서 사용처가 없는 role 입력을 제거하고, links 카드를 icon / 표시 텍스트 / 동작 URL 3열 구조로 정리합니다.
- 본문 에디터의 block 추가 버튼을 content width 설정보다 위에 두고, content width control은 좌측 정렬합니다.

### 구현
- `src/components/admin/BlockEditor.tsx`
  - block drag 중 `dragover`마다 배열을 재정렬하던 방식을 제거하고, `drop` 시점에 한 번만 `onChange(reorderBlocks(...))`를 실행하도록 변경했습니다.
  - block 추가 버튼을 `.block-add-actions`로 묶어 toolbar 상단에 배치하고, `Content width` select는 아래쪽 좌측 정렬로 변경했습니다.
- `src/components/admin/AdminApp.tsx`, `src/styles/admin.css`
  - Works category를 pill형 checkbox group으로 개선했습니다.
  - Profile role 입력 UI를 제거했습니다. DB/API 호환을 위해 내부 profile `role` field는 유지하되 validation은 빈 문자열도 허용합니다.
  - Profile links는 Add/Remove 없이 기존 link 목록을 icon, displayed text, click action 3열로 편집하도록 바꿨습니다.
  - Timeline editor에서 description 입력 UI를 제거하고, 저장 시 description은 빈 문자열로 보냅니다.
- `src/components/HomePage.astro`, `src/styles/global.css`
  - Public career timeline에서 description 렌더를 제거했습니다.
  - `html`/`body`에 x-overflow 차단을 추가해 work detail의 가로 스크롤 막대가 생기는 현상을 줄였습니다.
  - `global.css`와 `admin.css` 최상단에 `@charset "UTF-8";`을 추가했습니다.
- `src/db/schema.ts`, `src/lib/admin-data.ts`, `src/lib/content.ts`, `src/lib/validation.ts`, `src/types.ts`
  - Work category type/validation/row typing이 `UI/UX, BI/BX` 다중 category 문자열을 허용하도록 맞췄습니다.
- `migrations/0004_allow_multi_work_category.sql`
  - 기존 works 데이터를 보존하면서 D1 `works.category` CHECK 제약에 `UI/UX, BI/BX`를 추가하는 migration을 추가했습니다.

### 검증
- `npm run build` 통과
  - sandbox 내부에서는 Cloudflare Vite plugin의 inspector port listen이 `EPERM`으로 막혀 실패했고, 승인된 sandbox 밖 실행에서는 `astro check`와 `astro build` 모두 통과했습니다.
- `git diff --check` 통과
- `npm run db:migrate:local`과 `npm run db:migrate:remote`로 `0004_allow_multi_work_category.sql`을 local/remote D1 모두에 적용했습니다.

### 주의
- 배포/로컬 D1의 `works.category` CHECK 제약은 현재 `UI/UX, BI/BX`를 허용합니다.
- Profile role column/type은 기존 DB와 API 호환을 위해 아직 남겨두었습니다. public/admin UI에서는 쓰지 않습니다.

## 2026-05-14 Admin works editor scroll stabilization

### 요구사항
- Gemini가 save button과 editor drag UX 일부를 수정한 상태를 유지합니다.
- Admin Works editor 화면에서 본문 수정 중 스크롤 위치가 튀는 문제를 분석하고 완화합니다.
- Gemini가 추가한 Works category 중복 체크와 Client 숨김 처리 로직을 검토하고, 잘못된 부분은 보정합니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - `.work-editor` scroll container ref를 추가하고, `updateWorkLocal` 직전에 현재 `scrollTop`을 저장한 뒤 React render 직후 `useLayoutEffect` + `requestAnimationFrame`으로 같은 위치를 복원합니다.
  - category checkbox 로직을 helper 함수로 정리해 `UI/UX`, `BI/BX`, `UI/UX, BI/BX` 순서로만 저장되게 했고, 중복 category가 생기지 않도록 했습니다.
  - preview와 detail의 Client 숨김 처리 방향은 유지했습니다.
- `src/styles/admin.css`
  - `.work-editor`와 `.work-preview-scroll`에 `overflow-anchor: none`을 추가해 브라우저 scroll anchoring이 editor state update와 충돌하지 않도록 했습니다.
  - inline category 스타일을 `.category-check-group` class로 옮겼습니다.
- `src/types.ts`, `src/lib/validation.ts`
  - `WorkCategory`와 Zod validation이 `UI/UX, BI/BX` 다중 category 문자열도 허용하도록 확장했습니다.
- `src/components/HomePage.astro`
  - WORK gallery filter가 comma-separated category를 split해서 포함 여부로 판단하도록 변경했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Admin work editor unsaved guard

### 요구사항
- Admin 작업물 에디터에서 본문이나 상세 정보를 수정한 뒤 저장하지 않고 Work list로 돌아가거나 뒤로가기/닫기를 시도하면 저장 여부를 묻는 팝업을 띄웁니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - 서버에서 마지막으로 저장된 work snapshot과 현재 편집 중인 work snapshot을 비교해 `selectedWorkDirty` 상태를 계산합니다.
  - Work list 버튼, sidebar tab 이동, browser back(popstate) 시 unsaved 상태면 `window.confirm`으로 저장 여부를 묻습니다.
  - 확인을 누르면 현재 작업물을 저장한 뒤 이동하고, 취소를 누르면 에디터 화면에 머무릅니다.
  - 브라우저 닫기/새로고침처럼 직접 저장 실행이 불가능한 이동에는 `beforeunload` 기본 경고를 띄웁니다.
  - 저장, 신규 생성, 삭제, 최초 로드 후에는 saved snapshot을 갱신해 dirty 상태가 해제되도록 했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Admin works management restructure

### 요구사항
- 기존 한 화면형 작업물 관리 구조를 버리고, 작업물 리스트 화면과 작업물 에디터/미리보기 화면으로 나눕니다.
- 작업물 리스트는 public WORK gallery 카드 구조를 재사용하되 category filter는 제외하고, 카드 제목 아래에 작은 category label을 표시합니다.
- 작업물 카드를 드래그하면 순서 배치 모드가 되고, 변경된 순서가 public gallery 순서에도 반영되도록 저장합니다.
- 작업물 에디터는 기본 정보, 썸네일 설정, 본문 에디터를 각각 카드로 묶습니다.
- 본문 블록별 width 설정은 제거하고, 본문 에디터 전체 content width를 일괄 조정하는 방식으로 바꿉니다.
- 본문 블록 순서는 Up/Down 버튼 대신 우측 햄버거 handle drag로 변경합니다.
- 우측 live preview는 유지합니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - Works tab에 `workScreen` 상태를 추가해 `list`와 `editor` 화면을 분리했습니다.
  - 리스트 화면은 `.work-grid`, `.work-tile`, `.work-tile-media` 계열 public gallery class를 재사용합니다.
  - 작업물 카드는 native drag/drop으로 재정렬하고, drop 종료 시 `/api/admin/reorder`에 `type: "works"`로 저장합니다.
  - 에디터 화면은 `works-editor-layout` 안에 좌측 scroll editor, splitter, 우측 `WorkLivePreview` 구조를 유지합니다.
  - 에디터 좌측은 Basic, Images, Body editor 카드로 분리했습니다.
  - 더 이상 사용하지 않는 timeline reorder helper와 work Up/Down 목록 구조를 제거했습니다.
- `src/components/admin/BlockEditor.tsx`
  - block-level width select를 제거했습니다.
  - toolbar에 `Content width` select를 추가해 heading/paragraph/quote block의 `blockWidth`를 일괄 업데이트합니다.
  - 각 editor block 우측에 draggable hamburger handle을 추가하고, native drag/drop으로 block 배열 순서를 변경합니다.
- `src/styles/admin.css`
  - Gemini가 조정한 white surface + green accent 스타일을 유지하면서 Works list grid, editor card layout, drag states, block drag handle 스타일을 추가했습니다.
  - 이전 sidebar list 방식의 `.work-list`/`.work-select` 스타일은 제거했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-14 Floating top button tab style

### 요구사항
- Gemini가 조정한 admin page CSS 스타일을 이후 작업에서 보존합니다.
- Public page floating top button을 첨부 reference처럼 오른쪽 edge에 붙은 흰색 tab 형태로 변경합니다.
- Hover/focus/active 상태에서는 main accent color로 바뀌고, arrow는 흰색으로 바뀌어야 합니다.

### 구현
- `src/styles/global.css`
  - `.floating-top-button`을 원형 floating button에서 right edge에 붙는 rounded-left tab 형태로 변경했습니다.
  - 기본 상태는 48px white surface + black arrow + soft shadow입니다.
  - hover/focus/active 상태는 `var(--color-acid)` 배경과 white arrow를 사용합니다.
  - mobile width에서도 같은 48px 기준 크기를 유지합니다.
- Admin CSS 참고 상태
  - Gemini 수정본은 white surface, light gray background, green accent, soft card shadow 중심입니다.
  - 이후 admin 수정 시 기존 pastel/dark sidebar 스타일로 되돌리지 않도록 주의하세요.

### 검증
- `npm run build` 통과
  - 현재 admin 작업 변경분에서 `persistTimelineOrder`, `index` unused hint 2개가 표시되지만 build는 성공합니다.
- `git diff --check` 통과

## 2026-05-14 Small viewport snap and detail polish

### 요구사항
- 개발자도구 등으로 세로 viewport가 작아질 때 home snap section 아래쪽에 다음 section이 보이는 문제를 줄입니다.
- Admin WORK preview resize handle 위치가 어긋나지 않게 합니다.
- Career timeline list는 right 정렬을 없애고 left padding/offset 기준으로 배치합니다.
- Intro scroll cue는 위에서 아래로 나타나게 시작 위치를 바꿉니다.
- Featured dot으로 여러 작업물을 건너뛸 때 중간 작업물로 스크롤 애니메이션이 지나가지 않게 하고, blur 전환감만 남깁니다.
- Work detail `.work-hero-copy`의 summary 문단 bottom margin을 제거합니다.

### 구현
- `src/styles/global.css`
  - `--snap-panel-height`/`--snap-panel-offset`을 추가해 intro, identity sticky stage, work intro, featured stage/steps가 최소 `620px` 높이를 유지하게 했습니다.
  - `.timeline-items`를 `right` 대신 `--timeline-left` 기반 `left` 배치로 바꿨습니다.
  - `.intro-scroll-cue` 초기 transform을 위쪽 시작점으로 변경했습니다.
  - Featured dot jump 중 `.featured-list` 자체를 흐리지 않고, `.featured-stage::after`의 투명 backdrop blur layer로 전환감을 적용합니다.
  - `.work-hero-copy > p:not(.section-kicker)`의 bottom margin을 제거했습니다.
- `src/components/HomePage.astro`
  - Featured target 계산을 `window.innerHeight` 대신 실제 `.featured-step` 높이 기준으로 바꿔 작은 viewport에서도 CSS section 높이와 JS scroll target이 맞게 했습니다.
  - Identity progress range도 실제 sticky stage 높이를 빼도록 변경했습니다.
  - Featured dot click은 GSAP scroll tween이 아니라 짧은 blur 상태에서 `window.scrollTo(..., behavior: "auto")`로 즉시 target 위치에 맞춘 뒤 active panel을 적용합니다.
- `src/styles/admin.css`
  - `.work-splitter`에 `position: relative`, `align-self: stretch`, `height: 100%`를 지정해 pseudo handle이 splitter 기준으로 정렬되게 했습니다.

### 검증
- `npm run build` 통과
  - sandbox 내부에서는 Cloudflare Vite plugin의 inspector port listen이 `EPERM`으로 막혀 실패했고, 승인된 sandbox 밖 실행에서는 통과했습니다.
- `git diff --check` 통과

## 2026-05-13 Gallery hover polish and SDR upload normalization

### 요구사항
- Gallery card hover 시 shadow를 조금 더 강하게 하고, 약간 floating 되는 느낌을 줍니다.
- HDR 사진이 브라우저에서 HDR로 표시되지 않도록 가능하면 SDR로만 다룹니다.
- 이후 확인 중 gallery category FLIP 애니메이션과 hover transform이 겹칠 수 있어 floating 이동은 제거합니다.
- 추가 확인 결과 hover shadow 변화도 category animation 체감에 영향을 줄 수 있어 gallery card hover effect는 전부 제거합니다.

### 구현
- `src/styles/global.css`
  - `.work-tile-media` 기본 shadow만 유지하고 hover/focus-visible 변화는 제거했습니다.
  - `.work-tile` 자체 transform/transition도 제거해 category filter의 GSAP transform과 간섭하지 않게 했습니다.
- `src/components/admin/AdminApp.tsx`
  - Admin upload 직전에 raster image를 canvas에 다시 그린 뒤 sRGB/SDR 이미지로 재인코딩하도록 `normalizeImageForUpload`를 추가했습니다.
  - PNG는 PNG로 다시 저장해 투명도를 보존하고, 그 외 사진 계열은 JPEG(`-sdr.jpg`)로 저장합니다.
  - GIF/SVG는 HDR 사진 포맷이 아니고 canvas 변환 시 의미가 달라질 수 있어 그대로 통과시킵니다.

### 주의
- 기존에 이미 R2에 올라간 HDR asset은 자동 변환되지 않습니다. SDR로 고정해야 하는 기존 이미지는 admin에서 다시 업로드해야 합니다.
- CSS만으로 HDR 이미지를 항상 SDR로 강제하는 것은 신뢰하기 어렵기 때문에 업로드 단계 변환을 사용합니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-13 Featured dot and gallery card polish

### 요구사항
- Featured work dots를 화면 오른쪽에 더 붙이고, dot 간격을 좁힙니다.
- 선택되지 않은 featured dot도 투명도 없이 흰색으로 표시합니다.
- Gallery card thumbnail의 border line을 제거하고 아주 연한 shadow로 대체합니다.

### 구현
- `src/styles/global.css`
  - `.featured-dots` right offset을 `clamp(18px, 2.35vw, 45px)`로 줄이고 gap을 8px로 조정했습니다.
  - 비활성 `.featured-dot-mark`도 `#fff`와 opacity 1로 표시되게 했습니다.
  - `.work-tile-media` border를 제거하고 `0 12px 36px rgba(0, 0, 0, 0.055)` shadow를 적용했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-13 Admin work pane scroll and featured dot navigation

### 요구사항
- Admin 작업물 관리 화면에서 WORK 목록, 에디터, 미리보기 각각이 독립 스크롤을 갖게 합니다.
- Featured work 우측 dot에 hover하면 해당 작업물 제목 label이 표시되게 합니다.
- Featured work dot을 누르면 해당 작업물 featured thumbnail 위치로 바로 이동하게 합니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - Works tab일 때 `.admin-content.is-works-tab` class를 추가했습니다.
- `src/styles/admin.css`
  - Works tab admin content를 `100svh` 높이의 grid로 만들고 내부 overflow를 숨겼습니다.
  - `.work-list-panel`, `.work-editor`, `.work-preview-panel`을 각각 독립 scroll container로 정리했습니다.
  - 모바일 폭에서는 기존처럼 페이지 흐름으로 돌아가게 override했습니다.
- `src/components/HomePage.astro`
  - Featured dots를 `span`에서 접근 가능한 `button`으로 변경했습니다.
  - 각 dot에 작업물 title label과 target index를 부여했습니다.
  - Dot click 시 현재 scroll lock/tween을 정리하고 해당 featured snap target으로 이동합니다.
- `src/styles/global.css`
  - Featured dot hover/focus label preview 스타일을 추가했습니다.
  - Active/hover/focus dot 색상과 scale 상태를 marker 기준으로 조정했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-13 Remove obsolete cover blur comparison page

### 요구사항
- Detail cover blur를 사용하지 않기로 했으므로 이전에 만든 비교용 테스트 페이지가 더 이상 필요하지 않습니다.

### 구현
- `src/pages/cover-blur-compare.astro`를 삭제해 `/cover-blur-compare` 테스트 라우트가 배포에 포함되지 않게 했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-13 Gallery layout and identity width refinement

### 요구사항
- Featured work의 `더 알아보기 →` hover underline에서 화살표에는 밑줄이 생기지 않게 합니다.
- 21:9 같은 와이드 화면에서 about/career의 왼쪽 텍스트 영역이 과도하게 넓어지지 않도록 16:9 기준 비율을 유지합니다.
- WORK gallery grid를 5열에서 3열로 변경합니다.
- Gallery category filter 전환 시 카드들이 즉시 사라지는 대신 자연스럽게 이동하도록 합니다.
- Gallery thumbnail에도 detail 본문 이미지와 같은 radius를 적용합니다.

### 구현
- `src/components/HomePage.astro`
  - Featured more link 텍스트를 `<span>`으로 감싸 label에만 underline이 적용되게 했습니다.
  - Gallery filter는 View Transition 대신 GSAP FLIP 방식으로 구현했습니다.
  - 필터에서 사라지는 tile은 clone을 만들어 짧게 fade/scale out하고, 남는 tile은 이전 위치에서 새 위치로 움직이게 했습니다.
- `src/styles/global.css`
  - `.identity-stage` 왼쪽 column을 `min(63.9vw, 113.6svh)`로 제한해 16:9 기준 폭 이상으로 늘어나지 않게 했습니다.
  - `.work-grid`를 `repeat(3, minmax(0, 1fr))`로 변경했습니다.
  - `.work-tile-media`에 `border-radius: var(--radius-md)`를 추가했습니다.
  - Featured link underline은 내부 span에만 적용되도록 조정했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과

## 2026-05-13 Detail back button adaptive contrast

### 요구사항
- Gemini가 detail cover blur를 제거한 현재 코드를 유지합니다.
- Detail page 상단 back button이 cover 이미지 배경 밝기에 따라 흰색 또는 검은색으로 자동 전환되게 합니다.

### 구현
- `src/pages/work/[slug].astro`
  - 기존 canvas luminance 계산을 전체 이미지 평균이 아니라 실제 back button 뒤쪽 영역 샘플링 방식으로 변경했습니다.
  - Cover image의 `object-fit: cover` 렌더링 위치를 반영해 버튼 뒤쪽 72px 영역을 canvas에 그린 뒤 luminance를 계산합니다.
  - 투명 PNG도 자연스럽게 판단되도록 이미지 opacity와 paper background를 합성한 밝기를 사용합니다.
- `src/styles/global.css`
  - `data-cover-tone="dark"`일 때 back button을 흰색으로 표시합니다.
  - `data-cover-tone="light"`, title bar가 올라온 상태, cover fade가 진행된 상태에서는 검은색으로 표시합니다.
  - 색 전환에 짧은 transition을 추가했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 브라우저에서 `/work/rush-hour-app` 렌더링 및 `Back to work` button 존재 확인

## 2026-05-13 Detail cover blur comparison page

### 요구사항
- Detail cover의 이미지 위에 들어가는 gradient/blur 차이를 빠르게 비교할 별도 페이지를 만듭니다.
- 비교 기준은 `gradient + strong blur`와 `gradient only`입니다.
- 실제 detail page 스타일은 아직 변경하지 않고, 비교 페이지에서만 판단할 수 있게 합니다.

### 구현
- `src/pages/cover-blur-compare.astro`
  - 실제 WORK 데이터의 `featuredThumbnail` 또는 `thumbnail`을 자동으로 가져와 비교합니다.
  - 좌측은 같은 이미지를 복제한 blur image layer를 gradient 아래에 올립니다.
  - `backdrop-filter` 방식은 pseudo-element/mask 조합에서 시각 차이가 거의 안 보여, 비교 페이지에서는 `filter: blur()`가 걸린 복제 이미지로 차이가 명확하게 보이도록 바꿨습니다.
  - Blur layer mask는 상단 0%, 하단 100%에 가깝게 적용해 gradient가 흰색으로 변하는 영역에서만 강하게 보이도록 조정했습니다.
  - 우측은 같은 gradient만 적용하고 blur는 제외합니다.
  - `Fade` range input은 기본값 0으로 두고, detail cover의 scroll fade 정도를 필요할 때만 바꿔볼 수 있게 했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- `/cover-blur-compare` 브라우저 확인
  - `Gradient + Strong Blur`와 `Gradient Only` 비교 카드 렌더링 확인
  - `Fade` range input 렌더링 확인

## 2026-05-13 Disable shared view transitions

### 요구사항
- Shared View Transition이 gallery/detail/featured/detail 사이에서 꼬이므로 사용하지 않습니다.
- Gallery -> detail과 featured -> detail 모두 shared element transition 없이 가벼운 fade 정도만 남깁니다.
- Featured work에서 detail로 들어간 뒤 뒤로가기를 누르면 `/work` gallery로 고정 이동하지 말고, 이전 스크롤 위치로 돌아가야 합니다.
- 사용자가 Gemini로 조정한 about-career scroll logic은 건드리지 않습니다.

### 구현
- `src/layouts/PublicLayout.astro`
  - `astro:transitions`의 `ClientRouter`를 제거했습니다.
  - `astro:after-swap`에서 `/work` 진입 시 gallery로 강제 스크롤하던 코드를 제거했습니다.
  - 일반 링크 이동과 상세 back control에 수동 opacity fade를 적용하는 lightweight navigation handler를 추가했습니다.
- `src/components/HomePage.astro`
  - Featured work image의 `transition:name`을 제거했습니다.
- `src/pages/work/[slug].astro`
  - Detail cover image의 `transition:name`을 제거했습니다.
  - 상단 back control을 `/work` anchor가 아니라 `history.back()` 기반 button으로 변경했습니다.
  - 직접 진입 등 history back을 쓸 수 없는 경우에는 `/work`로 fallback합니다.
- `src/styles/global.css`
  - `::view-transition-*` CSS를 제거하고, `html.portfolio-fade-ready` / `html.portfolio-fade-leaving` 기반 opacity fade만 남겼습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- `/work`와 `/work/rush-hour-app` HTML에서 `transition:name` / `view-transition` / `featured-media` / `work-media` / `work-title` 출력이 남지 않음 확인
- 브라우저에서 `/work` featured link -> detail -> back control 흐름 확인
  - Detail 상단 back control은 `/work` 고정 링크가 아니라 history back으로 동작
  - 이전 `/work` 스크롤 위치가 Featured work로 복원됨 확인

## 2026-05-13 Featured-only view transition rework

### 요구사항
- 사용자가 별도로 조정한 about-career scroll logic은 유지합니다.
- 기존 gallery thumbnail -> detail cover shared view transition은 해제합니다.
- Gallery에서 detail로 들어갈 때는 shared transition 없이 route-level fade 정도만 적용합니다.
- Featured work에서 detail로 들어갈 때만 featured image -> detail cover shared transition을 적용합니다.
- Shared transition 대상이 아닌 나머지 화면 요소는 부드럽게 fade되도록 정리합니다.

### 구현
- `src/components/HomePage.astro`
  - Gallery `.work-tile-media`와 gallery title의 기존 `transition:name`을 제거했습니다.
  - Featured work image에만 `transition:name="featured-media-{slug}"`를 부여했습니다.
  - Featured work `더 알아보기` 링크의 `data-astro-reload`를 제거해 Astro ClientRouter transition을 다시 사용하게 했습니다.
  - 사용자가 변경한 `careerEntry` 기반 scroll snap 로직은 유지했고, unused local 변수만 제거했습니다.
- `src/pages/work/[slug].astro`
  - Detail cover image가 `featuredThumbnail`을 우선 사용하고, 없으면 `thumbnail`으로 fallback하도록 변경했습니다.
  - Detail cover image에 `transition:name="featured-media-{slug}"`를 부여했습니다.
  - Detail title의 기존 `work-title` shared transition은 제거했습니다.
- `src/components/admin/AdminApp.tsx`
  - Admin 설명을 현재 역할에 맞게 조정했습니다.
  - `Gallery thumbnail`: WORK gallery card용
  - `Featured thumbnail`: Featured work full-screen background와 detail 상단 cover용
  - Live preview cover도 `featuredThumbnail` 우선으로 표시합니다.
- `src/styles/global.css`
  - ClientRouter route transition의 root old/new에 명시적인 fade animation을 추가했습니다.
  - Shared image transition이 없는 gallery -> detail 이동은 root fade만 타도록 정리했습니다.

### 검증
- `npm run build` 통과
- `git diff --check` 통과
- 로컬 `http://127.0.0.1:4325/work` HTML 확인
  - Featured image에만 `featured-media-*` view-transition-name 출력
  - Gallery tile에는 `work-media`/`work-title` transition name이 출력되지 않음
  - Featured link에 `data-astro-reload`가 없음
- 로컬 `http://127.0.0.1:4325/work/rush-hour-app` HTML 확인
  - Detail cover image에 `featured-media-rush-hour-app` transition name 출력
  - Detail title에는 shared transition name 없음

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
