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

## 2026-08-26 Home Loading, Career Endpoints, And Gallery Height

### 요구사항
- 첫 방문에서 초기 로고가 애니메이션 준비 전에 보이는 현상을 로딩 애니메이션으로 가립니다.
- Career 첫 항목과 마지막 항목이 타임라인 창 중앙에서 시작하고 끝나게 합니다.
- WORK Gallery 섹션 아래의 과도한 빈 공간을 제거하고 섹션 높이를 실제 gallery canvas와 맞춥니다.

### 구현
- `HomePage.astro`, `home-identity.css`, `home-page.ts`, `motion-loader.ts`
  - 루트 인트로에 검은 전체 화면 로더와 흰색 circular sweep을 추가했습니다.
  - 첫 페인트부터 스크롤을 잠그고 페이지 load·font 준비를 기다린 뒤 로더를 fade-out합니다. 로고는 초기 `autoAlpha: 0` 상태에서 로더 종료 후 blur fade를 시작해 초기 HTML flash를 방지합니다.
  - 로더가 무한정 남지 않도록 4.5초 fallback과 reduced-motion/모션 모듈 실패 즉시 해제를 추가했습니다.
  - 로더와 인트로 모션의 자연스러운 handoff를 위해 루트에서도 GSAP runtime을 즉시 초기화합니다.
- `home-identity.ts`, `home-identity.css`
  - 첫·마지막 Career 카드의 펼쳐진 실제 높이로 timeline track의 시작·끝 padding을 계산합니다.
  - 활성 상세 내용에 따라 트랙 높이가 바뀌어도 현재 첫·마지막 카드 중심 좌표를 직접 보간해 양 끝을 정확히 중앙에 맞춥니다.
- `home-featured.ts`, `home-work.css`
  - Gallery의 강제 `2 * viewport` 최소 높이를 제거했습니다.
  - Gallery는 실제 canvas 높이를 따르되 한 panel의 최소 높이를 유지하며, Featured overlap도 한 panel로 맞춰 Gallery가 고정된 Featured 위로 올라오게 합니다.

### 검증
- `npm test`: 단위 테스트 72개, 통합 테스트 10개 통과.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- Playwright desktop 검증에서 로더 종료 후 로고 opacity가 정상 복구되고, Career 첫·마지막 카드 중심 오차가 2px 이내이며, Gallery 전환 중 Featured가 화면 상단에 고정된 채 Gallery가 그 위로 진입함을 확인했습니다.

### 배포 상태
- 현재 변경은 로컬에만 있으며 아직 commit/push 또는 운영 배포하지 않았습니다.

### Career 양 끝 대기 구간 후속 조정
- 첫 Career 항목이 나타난 뒤 두 번째 항목으로 이동하기 전 scroll dwell과 마지막 항목 뒤 WORK 섹션이 시작되기 전 scroll dwell을 기존 거리의 50%로 줄였습니다.
- 중간 항목의 카드 중심 계산과 시각 전환 방식은 유지합니다.

### Gallery 최소 화면 높이 후속 조정
- Gallery 콘텐츠가 viewport보다 짧으면 문서 끝에서 Gallery 상단까지 스크롤할 공간이 부족해 뒤의 Featured가 노출되는 원인을 수정했습니다.
- `gallery-section`은 실제 canvas 높이를 따르되 최소 한 panel 높이를 유지합니다. 콘텐츠가 한 화면보다 길면 별도 하단 여백은 추가되지 않습니다.
- Gallery와 Featured의 overlap도 canvas 높이와 분리해 정확히 한 panel 높이로 유지합니다. 전환 중에는 Featured가 sticky 상태로 남고 Gallery가 그 위로 올라옵니다.
- 브라우저 통합 테스트에서 전환 중간의 Featured 고정 상태와 `/work` 진입 시 Gallery의 완전한 덮임을 함께 검증합니다.

## 2026-08-25 Local Content Production Deployment

### 요구사항
- 현재 로컬 D1/R2 콘텐츠와 코드 변경 전체를 운영 사이트 기준으로 배포합니다.

### 데이터 승격
- 운영 D1을 `../backups/d1/remote-before-deploy-2026-08-25.sql`로 먼저 백업했습니다.
- 기존 전체 R2 백업 `../backups/r2/remote-prod-2026-08-19/`을 확인하고, 운영 R2는 삭제 없이 로컬에서 참조하는 고유 object 466개를 검증 후 업로드했습니다.
- `scripts/export-d1-via-execute.mjs`에 `--local`/`--remote` 모드를 추가하고, `scripts/promote-r2-assets.mjs`를 추가해 D1 dump가 참조하는 원본·variant object를 모두 사전검증한 뒤 운영 R2로 승격할 수 있게 했습니다.
- 운영 D1에 `0006_website_work_block.sql`, `0007_divider_work_block.sql`을 적용한 뒤 로컬 덤프 `../backups/d1/local-to-deploy-2026-08-25.sql`을 승격했습니다.
- Wrangler 원격 import는 SQL `BEGIN TRANSACTION`/`COMMIT`을 허용하지 않으므로 해당 두 문장만 제거한 임시 D1 import 파일을 사용했습니다. 첫 시도는 실행 전에 거부되어 운영 DB가 자동으로 원상복구됐고, 변환 후 745 queries가 정상 처리됐습니다.

### 운영 콘텐츠 결과
- profile 1, timeline_items 8, works 7, work_blocks 148, assets 135, asset_variants 430, migrations 7로 로컬과 운영이 일치합니다.
- 로컬 기준에 없는 기존 운영 작업물 `a2z-homepage`는 제거됐습니다.
- `PRAGMA foreign_key_check` 결과 오류가 없습니다.

### 검증
- `npm run test:unit`: 72 tests passed.
- `npm run test:integration`: 9 integration tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- Git commit `824afe2`를 GitHub `main`에 push하고 Cloudflare Worker version `f6cbf759-b1c5-4e2a-b602-478be24c21a6`을 `dolbakggom.com`에 배포했습니다.
- 운영 `/api/health`는 HTTP 200과 `database: available`, 홈은 HTTP 200으로 응답했습니다.
- 공개 상태인 `ptubootcamp`, `rush-hour-app`, `hexalabs`, `a2z-presenter`, `roii-hmi`는 HTTP 200이며 각 상세에 이전·다음 프로젝트 내비게이션이 렌더링됩니다.
- `roii-tablet`, `autonomous-vehicle-branding`은 로컬과 동일하게 `published = 0`인 초안이므로 공개 URL HTTP 404가 정상입니다.
- 실제 Rush Hour R2 WebP media route는 HTTP 200, `image/webp`, 118,010 bytes로 응답했습니다.

## 2026-08-23 Work Navigation Design Study

### 요구사항
- Rush Hour 작업물 상세 본문 하단에서 이전·다음 프로젝트로 이동하는 내비게이션 시안 4개를 별도 로컬 페이지로 비교합니다.

### 구현
- `/preview/work-navigation`에 실제 로컬 Rush Hour 표지, 기본 정보, 본문 블록을 재사용하고 4가지 하단 내비게이션을 연속 배치했습니다.
- 에디토리얼 분할, 이미지 듀얼 패널, 다음 프로젝트 강조, 프로젝트 인덱스 방식으로 구성했으며 실제 인접 프로젝트 링크와 콘텐츠를 사용합니다.
- 인접 프로젝트 이미지가 없을 때 시안 검토가 가능하도록 Rush Hour 표지를 임시 시각 자료로 사용합니다.
- 비교 페이지는 개발 환경에서만 열리며 운영 빌드에서는 HTTP 404를 반환합니다.

### 검증
- `npm run build`: 0 errors, 0 warnings, 0 hints.
- 로컬 브라우저: 4개 시안 렌더링, 이미지 실패 0, 데스크톱/390px 모바일 가로 overflow 0.
- 선택안 적용 후 `npm test`: 단위 70개, 통합 9개 통과. 회귀 테스트 추가 후 `npm run test:unit`: 71개 통과. 실제 Rush Hour 최신 렌더에서 전체 폭 1280px, 높이 260px, overflow 0 및 앞뒤 프로젝트 연결을 확인했습니다.
- 원형 hover는 포인터 좌표가 CSS 변수로 전달되고 `clip-path: circle(150%)`까지 확장되는 상태를 확인했습니다.

### 후속
- 사용자가 2번 Full image panels 시안을 선택했습니다.
- 실제 `/work/[slug]` 하단에 관리자 WORK 정렬 순서 기반의 이전·다음 순환 탐색을 적용하고, 선택이 끝난 비교용 페이지와 전용 CSS는 제거했습니다.
- 내비게이션은 `100vw` 좌우 전체 폭, 데스크톱 높이 260px이며 모바일에서는 220px 패널 두 개가 세로로 배치됩니다.
- 포인터 위치에서 시작하는 원형 `clip-path`가 확장되며 이미지에 메인 `--color-acid` 컬러가 입혀지고, 키보드 포커스에서는 중앙 기준으로 같은 전환을 제공합니다.
- 후속 조정으로 녹색 레이어의 blend mode를 제거해 이미지 위를 불투명한 `#08c840` 단색이 완전히 덮도록 변경했습니다.
- 데스크톱 높이를 320px로 늘리고 제목 행간과 메타 간격을 확대했습니다. 크기 위계는 제목 > Previous/Next > 카테고리·연도로 고정했습니다.
- Previous/Next 화살표에 상세 상단바와 같은 sweep 애니메이션을 방향별로 적용했습니다.
- 후속 검증: `npm run build` 0 errors/warnings/hints, `npm run test:unit` 71개 통과. 1280px 화면에서 내비게이션 1280×320px, overflow 0, tint `rgb(8, 200, 64)`/`mix-blend-mode: normal`, 방향 화살표 520ms sweep을 확인했습니다.
- 사용자 정정에 따라 Work Detail 최상단 커버의 paper 색상 하단 그라데이션은 원래대로 복구했습니다.
- 제거 대상은 하단 이전·다음 프로젝트 패널의 검정 세로 그라데이션이었습니다. 이를 균일한 검정 오버레이로 교체하고, 단색 녹색 reveal을 그 위 레이어로 올려 hover 전체가 정확한 `#08c840`으로 보이게 수정했습니다.
- 녹색 원과 동일한 `clip-path`를 쓰는 검정 텍스트 복제 레이어를 추가했습니다. 원이 지나간 부분의 제목, Previous/Next, 카테고리·연도, 화살표만 검정으로 바뀌고 나머지는 흰색으로 남아 배경과 전경 대비가 공간적으로 함께 전환됩니다.
- 쿼리스트링이 있는 로컬 URL에서만 최신 내비게이션이 보이고 일반 Work URL에는 이전 HTML이 남던 원인을 확인했습니다. 미들웨어의 10분 Cloudflare Cache API가 Astro 개발 서버에서도 동작해 기존 HTML을 반환하고 있었습니다.
- 공개 HTML Cache API는 이제 `import.meta.env.PROD`에서만 사용합니다. 운영의 10분 TTL/purge 정책은 유지하고, `npm run dev`에서는 모든 Work Detail이 쿼리스트링 없이 즉시 최신 렌더를 반환합니다.
- 검증: `npm run test:unit` 72개 통과, `npm run build` 0 errors/warnings/hints. 쿼리스트링 없는 Rush Hour, HEXA LABS, 평택대학교 Work Detail에서 내비게이션과 동기화된 텍스트 reveal 레이어가 모두 렌더링되는 것을 확인했습니다.

## 2026-08-23 Divider Work Block

### 요구사항
- 작업물 본문 에디터에 콘텐츠 구획을 나누는 구분선 블록을 추가합니다.

### 구현
- `Divider`를 정식 작업물 블록 타입으로 추가하고 에디터 툴바, 편집 카드, 실시간 미리보기, 공개 상세 페이지에서 동일하게 지원합니다.
- 공개 페이지와 미리보기에서는 의미 있는 `<hr>` 요소를 1px 중립색 선으로 렌더링합니다.
- 기존 데이터에 영향을 주지 않고 D1 제약 조건을 확장하는 `migrations/0007_divider_work_block.sql`을 추가했습니다.
- 저장 후 D1 블록이 공개 페이지의 구분선으로 렌더링되는 통합 테스트와 콘텐츠 정규화 단위 테스트를 추가했습니다.

### 중요 파일
- `src/components/admin/BlockEditor.tsx`
- `src/components/admin/AdminSupport.tsx`
- `src/components/WorkBlocks.astro`
- `src/lib/work-block-content.ts`
- `migrations/0007_divider_work_block.sql`

### 검증
- `npm run db:migrate:local`: `0007_divider_work_block.sql` 적용 성공.
- `npm run test:unit`: 70개 통과.
- `npm run test:integration`: 빌드 0 errors/warnings/hints, 통합 테스트 9개 통과.

### 배포 주의
- 배포 환경에서 새 Website/Divider 블록을 저장하기 전에 원격 D1에 `0006`, `0007`을 적용해야 합니다.
- `README.md`에 운영 백업 → 전체 테스트 → `npm run db:migrate:remote` → Worker 배포 → `/api/health` → 관리자 저장/공개 렌더링 확인 순서의 배포 체크리스트를 추가했습니다.

## 2026-08-19 Website Detail Block

### 요구사항
- 작업물 상세 본문에 실제 운영 사이트로 이동하는 `website` 블록을 추가합니다.
- 검토한 네 시안 중 검은 배경의 4번 CTA 시안을 사용하고, 사이트 대표 이미지는 대상 사이트 설정에서 자동으로 가져옵니다.
- 사이트 제목과 설명은 자동 수집 후 관리자가 블록에서 자유롭게 수정할 수 있어야 합니다.

### 구현
- `migrations/0006_website_work_block.sql`, `src/types.ts`, `src/db/schema.ts`, `src/lib/work-block-content.ts`
  - D1 `work_blocks.type`에 `website`를 추가하고 URL, 제목, 설명, 도메인, R2 대표 이미지 정보를 검증·정규화합니다.
- `src/lib/website-metadata.ts`, `src/pages/api/admin/website-metadata.ts`
  - 관리자 전용 API가 `og:title`, `og:description`, `og:image`를 우선 수집하고 일반 title/description으로 fallback합니다.
  - 대표 이미지는 외부 hotlink 대신 R2 `website/` 경로로 가져오며 assets metadata를 D1에 저장합니다.
  - HTTP(S)만 허용하고 credentials, localhost, private/link-local IP, 내부 도메인, 과도한 redirect/응답 크기를 차단합니다.
- `src/components/admin/BlockEditor.tsx`, `src/components/admin/AdminSupport.tsx`
  - Website 블록 추가, URL 기반 정보 불러오기, custom title/description 편집, 대표 이미지 상태와 실시간 미리보기를 추가했습니다.
- `src/components/WorkBlocks.astro`, public/admin CSS
  - 검은 배경의 copy/image 분할 CTA를 데스크톱에 적용하고 모바일에서는 세로로 전환합니다.
  - hover/focus 시 초록색 CTA와 화살표 이동, 대표 이미지 확대 효과를 적용했습니다.
- `src/scripts/home/home-featured.ts`
  - 통합 검수에서 발견된 Featured dot 클릭 상태와 ScrollTrigger 갱신의 순서 경쟁을 제거해 클릭한 패널 상태가 안정적으로 유지되게 했습니다.

### 검증
- `npm run test:unit`: 67 tests passed.
- `npm run build`: Astro check 0 errors, Cloudflare server build complete.
- `npm run test:integration`: 9 integration tests passed.
- local D1 migration `0006_website_work_block.sql`: 6 commands applied, `PRAGMA foreign_key_check` 오류 없음.
- 실제 `dolbakggom.com`에서 Open Graph title/description과 `/og-image.png`를 읽고 PNG 17,529 bytes를 정상 검증했습니다.
- 임시 local D1 블록으로 1440px/390px 공개 렌더링을 확인했습니다. 최종 모바일 card/media width가 모두 358px, 가로 overflow 0, 대표 이미지 natural width 2560px임을 확인한 뒤 임시 블록을 삭제했습니다.

### 남은 주의점
- 운영 배포 전 `npm run db:migrate:remote`로 `0006_website_work_block.sql`을 운영 D1에 먼저 적용해야 Website 블록 저장이 가능합니다.
- 일부 사이트가 Open Graph 이미지를 제공하지 않거나 bot 요청을 차단하면 제목·설명만 채워지고 관리자에 대표 이미지 경고가 표시됩니다. 기존 블록 이미지가 있으면 실패 시 유지됩니다.

### 후속 시각 조정
- Website 블록의 액션 문구를 `Visit website`에서 `사이트 바로가기`로 변경하고 글자와 화살표 크기를 키웠습니다.
- 좌우 분할 이미지를 제거하고 대표 이미지를 블록 전체 배경으로 확장했습니다.
- 이미지에 강한 blur, 낮은 saturation/brightness, 검은 gradient overlay를 적용해 전면 제목과 설명의 대비를 유지합니다.
- 공개 페이지와 관리자 실시간 미리보기에 동일한 시각 구조를 반영했습니다.

### Tools 메타데이터 라벨
- 기존 작업물 데이터의 `role` 값이 Figma, Illustrator 등 사용 도구로 채워지는 실제 용도에 맞춰 공개 상세, 관리자 에디터, 실시간 미리보기의 표시 라벨을 `Tools`로 변경했습니다.
- 관리자 입력에는 쉼표 구분 도구 예시를 추가하고, 빈 값 fallback은 의미가 다른 `Design` 대신 `—`로 변경했습니다.
- 운영 데이터와 API 호환성을 위해 내부 `role` 필드명과 D1 column은 유지합니다.
- 통합 테스트에 공개 `Tools` 라벨/값과 관리자 입력/실시간 미리보기 라벨 검증을 추가했습니다. `npm test` 결과 unit 67개와 integration 9개가 모두 통과했습니다.
- 실제 local `/work/roii-hmi`를 1440px/390px로 확인해 `Tools` 1개, `Role` 0개, 기존 값 `Figma, Adobe Illustrator`, 가로 overflow 0을 확인했습니다.

## 2026-08-20 Sticky Body Block Toolbar

### 요구사항
- 작업물 본문이 길어져도 Heading, Paragraph, Image, Gallery, Quote, Website 블록 추가 버튼을 다시 찾기 쉽도록 상단에 따라오는 기능을 추가합니다.

### 구현
- `src/styles/admin/works-editor.css`
  - `.block-toolbar`를 본문 에디터 범위 안의 sticky toolbar로 변경했습니다.
  - 반투명 흰색 배경, backdrop blur, 구분선과 약한 그림자로 아래 콘텐츠와 구분합니다.
  - toolbar는 본문 블록 영역이 끝날 때 함께 해제되며 각 버튼 크기는 스크롤 중에도 유지됩니다.
- `src/styles/admin/responsive.css`
  - 모바일에서는 work editor의 내부 overflow를 해제하고 viewport page scroll 기준으로 8px 여백을 두고 따라오게 했습니다.

### 검증
- 통합 테스트가 본문 목록을 1600px로 확장하고 editor scroll을 이동한 뒤 toolbar의 computed position이 `sticky`, top이 `0px`, editor 상단과의 실제 offset이 1px 이내인지 확인합니다.
- `npm run test:integration`: 9 tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.

## 2026-08-20 Full-Width Text Block Defaults

### 요구사항
- Content width를 `100%`로 사용 중인데 새 Paragraph 등 텍스트 블록이 `880px`로 생성되어 매번 다시 설정해야 하는 문제를 해결합니다.

### 구현
- Heading, Paragraph, Quote의 schema·저장 정규화·공개 렌더러·관리자 미리보기 기본 폭을 `880px`에서 `100%`로 변경했습니다.
- 관리자에서 새 텍스트 블록을 추가하면 고정 기본값 대신 현재 Content width 선택값을 상속합니다.
- 기존에 `680px`, `880px`, `1080px`로 명시 저장된 블록 값은 변경하지 않습니다.

### 검증
- width가 없는 Heading, Paragraph, Quote payload가 모두 `100%`로 정규화되는 단위 테스트를 추가했습니다.
- 관리자에서 Paragraph를 실제 추가한 뒤 실시간 미리보기의 width가 `100%`인지 확인하는 통합 테스트를 추가했습니다.
- 전체 검수 중 Lenis의 즉시 이동 완료 콜백이 Featured dot 활성 상태를 간헐적으로 덮는 기존 경쟁 조건을 재현해, 클릭 직후와 스크롤 완료 시점 모두 선택한 패널을 확정하도록 보강했습니다.
- `npm run test:unit`: 68 tests passed.
- `npm run test:integration`: 9 tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.

## 2026-08-23 Work Heading Top Spacing

### 요구사항
- 작업물 상세의 모든 Heading 위쪽을 아래쪽보다 더 띄우고, 첫 번째 Heading도 같은 규칙을 적용합니다.

### 구현
- 공개 상세 Heading에 `margin-top: 24px`를 추가했습니다. 공통 block gap `34px`와 합쳐 위쪽은 총 `58px`, 아래쪽은 기존 `34px`입니다.
- 관리자 축소 실시간 미리보기에는 비율에 맞춰 Heading 위쪽 `12px`를 추가했습니다.
- 첫 번째 Heading을 제외하는 selector를 사용하지 않아 모든 Heading에 동일하게 적용됩니다.

### 검증
- 공개 및 관리자 미리보기의 Heading top margin과 첫 번째 Heading 예외 selector 부재를 확인하는 회귀 테스트를 추가했습니다.
- `npm run test:unit`: 69 tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.

## 2026-08-19 Production Content Synced To Local

### 요구사항
- 운영 사이트에서 작성한 최신 콘텐츠를 로컬 D1/R2로 동기화하고, 이후 로컬에서 콘텐츠를 함께 작성·검수할 수 있게 합니다.

### 원인과 상태
- 동기화 전 로컬은 `works 7`, `work_blocks 13`, `assets 30`, `asset_variants 0`이었습니다.
- 운영은 `works 8`, `work_blocks 5`, `assets 41`, `asset_variants 136`이었고, 2026-08-19에 추가된 `ptubootcamp` 작업물이 로컬에 없었습니다.
- 기존 D1 export 스크립트는 `asset_variants`를 누락했고 R2 sync 스크립트는 원본 `assets.r2_key`만 복사했습니다.

### 구현 및 동기화
- `scripts/export-d1-via-execute.mjs`
  - `asset_variants` 조회/INSERT와 안전한 삭제 순서를 추가했습니다.
- `scripts/sync-r2-assets.mjs`
  - INSERT column을 이름 기준으로 해석하고 `assets`와 `asset_variants`의 모든 R2 key를 수집하도록 개선했습니다.
  - 중복 key를 제거한 뒤 MIME을 유지하며 remote R2에서 local R2로 복사합니다.
- 백업
  - `../backups/d1/local-before-sync-2026-08-19.sql`
  - `../backups/d1/remote-prod-2026-08-19.sql`
  - `../backups/r2/remote-prod-2026-08-19/` (169 objects, 96MB)
- 운영 덤프를 local D1에 적용하고 고유 R2 object 169개를 local R2로 복사했습니다.
- README에 Git 배포와 D1/R2 콘텐츠 배포가 별개라는 점, 권장 콘텐츠 편집·승격 흐름을 추가했습니다.

### 검증
- 동기화 후 local D1: `profile 1`, `timeline_items 8`, `works 8`, `work_blocks 5`, `assets 41`, `asset_variants 136`.
- `PRAGMA foreign_key_check`: 오류 없음.
- 로컬 `/`, `/admin`, `/work/ptubootcamp`: 모두 HTTP 200.
- `ptubootcamp` 대표 이미지 local media route: HTTP 200, `image/webp`, 203176 bytes.

### 남은 주의점
- 로컬 관리자에서 저장한 콘텐츠는 `git push`만으로 운영 D1/R2에 반영되지 않습니다.
- 콘텐츠 작성 완료 후 운영 D1/R2를 다시 백업하고 로컬 검수본을 명시적으로 승격해야 합니다. 이 작업은 다음 콘텐츠 검수 완료 시 수행합니다.

## 2026-07-22 About Caption Deferred Image Recovery

### 요구사항
- `/about` 사진 캡션이 운영 메인 스크롤 흐름에서 보이지 않는 문제를 처음부터 다시 추적하고 해결합니다.

### 원인
- `/about` 직접 진입에서는 프로필 이미지가 즉시 로드되어 캡션이 보였지만, 메인 `/`에서는 프로필 이미지가 `data-deferred-src`로 지연 로드됩니다.
- 공용 이미지 오류 감지 코드가 아직 `src`가 없는 지연 이미지를 `complete && naturalWidth === 0`으로 판단해 이미지 프레임에 `is-image-unavailable`을 붙였습니다.
- 이후 사진은 정상 로드됐지만 실패 클래스와 접근성 속성이 복구되지 않았고, 해당 실패 클래스가 캡션을 계속 숨겼습니다.
- 사진의 grayscale/brightness/blur가 `<figure>` 전체에 적용되어 캡션까지 함께 흐려지고 어두워지는 구조도 가시성을 낮췄습니다.

### 구현
- `src/lib/public-resilience.ts`, `src/layouts/PublicLayout.astro`
  - `data-deferred-src`가 남은 이미지는 실제 로드 전 실패 판정에서 제외합니다.
  - 이미지 `load` 성공 시 실패 클래스, hidden 상태, fallback용 role/aria-label을 복구합니다.
- `src/components/HomePage.astro`, `src/styles/home-identity.css`, `src/styles/responsive.css`
  - 사진 효과 전용 `.profile-media-visual` 레이어를 추가하고 캡션을 그 레이어의 형제로 분리했습니다.
  - 사진 필터와 overlay는 visual 레이어에만 적용하고 캡션은 선명한 78% white와 text shadow로 독립 렌더링합니다.
  - desktop/mobile 및 reduced-motion 상태에서도 기존 사진 전환과 fallback 동작을 유지합니다.
- `tests/public-resilience.test.ts`, `tests/css-build-compatibility.test.ts`
  - 지연 이미지 오판 방지와 사진 효과/캡션 레이어 분리를 검증하는 회귀 테스트를 추가했습니다.

### 검증
- 새 로컬 production preview를 별도 `4399` 포트에서 실행해 오래된 Worker cache와 분리했습니다.
- Chrome 1440px `/about` 직접 진입: 캡션 `display: block`, `filter: none`, color 78% white 확인.
- Chrome 390px `/about` 직접 진입: 캡션 우하단 표시 및 연락처 비중첩 확인.
- Chrome 1440px 메인 `/` 인트로 완료 후 wheel 1회 About 진입: 캡션 `display: block`, 실제 screenshot 표시 확인.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `npm run test:unit`: 63 tests passed.

### 남은 주의점
- 운영 반영은 이 변경을 commit/push한 뒤 새 Cloudflare 배포가 완료되어야 확인할 수 있습니다.

## 2026-07-21 Work Detail Visible Glass Layer And Responsive Profile Caption

### 요구사항
- 작업물 상세 고정 상단 바에 속성만 존재하는 수준이 아니라 눈으로 분명히 구분되는 뒤 배경 blur를 적용합니다.
- About 프로필 이미지의 `취미로 기타를 치고 있습니다.` 캡션이 실제 화면에서 사라지는 문제를 해결합니다.

### 원인
- 운영 Chrome에서 기존 상단 바의 `backdrop-filter: blur(18px)`는 정상 계산됐지만 paper 배경이 66%로 덮여 blur 전후 픽셀 차이가 거의 보이지 않았습니다.
- 프로필 캡션은 `1180px` 이하 responsive CSS에서 의도적으로 `display: none` 처리돼 DevTools를 열거나 작은 화면에서 사라졌습니다.

### 구현
- `src/styles/work-detail.css`
  - 상단 바의 버튼·제목과 유리 배경을 `::before` 레이어로 분리했습니다.
  - 활성 유리 레이어는 paper 38%, `blur(36px) saturate(112%)`를 사용해 뒤 콘텐츠는 확실히 흐리고 상단 바 콘텐츠는 선명하게 유지합니다.
- `src/styles/responsive.css`
  - 캡션 숨김을 제거하고 1180px 이하에서는 24px, 760px 이하에서는 16px의 우하단 여백과 반응형 글자 크기를 적용했습니다.
- `tests/css-build-compatibility.test.ts`
  - 유리 레이어 구조와 responsive 캡션 숨김 재발을 막는 회귀 테스트를 추가했습니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- 로컬 production preview + Chrome 1440px: 활성 `::before`에 `rgba(244, 244, 244, 0.38)`, `blur(36px) saturate(1.12)` 계산 및 실제 배경 흐림 확인.
- 운영 R2 이미지를 사용하는 Chrome 1100px와 390px: 캡션 `display: block`, 이미지 우하단 배치와 연락처 비중첩 확인.

### 남은 주의점
- 배포 전 운영 페이지에는 이전 CSS가 유지됩니다. 새 commit 배포 후 Cloudflare HTML/asset cache가 갱신된 상태에서 확인해야 합니다.

## 2026-07-21 Preserve Backdrop Filter Through Production Build

### 요구사항
- source CSS와 직접 주입 검사에서는 보이지만 배포된 작업물 상세 상단 바에서는 blur가 적용되지 않는 문제를 해결합니다.

### 원인
- source에서 표준 `backdrop-filter` 뒤에 `-webkit-backdrop-filter`를 선언해 Astro/Vite CSS 최적화가 두 속성을 중복으로 판단했습니다.
- production bundle에는 Safari prefix만 남고 Chrome이 사용하는 표준 속성은 제거되어 computed style이 `none`이 됐습니다.
- `blur(0)`과 `saturate(100%)`도 optimizer가 빈 함수로 축약해 기본 transition 값이 무효화됐습니다.

### 구현
- `src/styles/work-detail.css`
  - prefix 선언을 먼저, 표준 선언을 마지막에 두어 production bundle에 두 속성이 모두 남도록 했습니다.
  - transition 시작값은 시각 차이가 없는 `blur(0.01px) saturate(100.01%)`로 변경해 빈 함수 최적화를 방지했습니다.
- `src/styles/home-work.css`, `src/styles/responsive.css`, `src/styles/admin/shell.css`, `src/styles/admin/responsive.css`
  - 같은 build 제거 문제가 재발하지 않도록 모든 backdrop-filter pair의 순서를 동일하게 수정했습니다.
- `tests/css-build-compatibility.test.ts`
  - prefix가 표준 선언 뒤로 이동하거나 filter identity 값이 다시 사용되면 실패하는 회귀 테스트를 추가했습니다.

### 검증
- 수정 전 production computed style: 활성 상태에서도 `backdrop-filter: none`.
- 수정 후 `dist/server/entry.mjs`:
  - 기본 상태에 `backdrop-filter: blur(.01px) saturate(100.01%)` 보존.
  - 활성 상태에 `backdrop-filter: blur(18px) saturate(110%)` 보존.
  - 두 상태 모두 `-webkit-backdrop-filter`도 함께 보존.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `npm run test:unit`: 60 tests / 0 failures.
- `git diff --check`: 통과.

## 2026-07-21 Work Detail Direct Backdrop Filter

### 요구사항
- 작업물 상세 상단 바의 blur가 일부 브라우저에서 보이지 않는 문제를 수정합니다.

### 구현
- `src/styles/work-detail.css`
  - 별도 `::before` 합성 레이어를 제거하고 `.work-detail-topbar` 자체에 `backdrop-filter`와 `-webkit-backdrop-filter`를 직접 적용했습니다.
  - 기본 상태는 투명 배경과 `blur(0)`, 활성 상태는 paper 66%와 `blur(18px) saturate(110%)`로 전환됩니다.
  - 흰색 레이어의 불투명도를 낮춰 뒤 콘텐츠의 blur가 시각적으로 구분되게 했습니다.

### 검증
- 운영 `hexalabs` 페이지에 새 CSS를 임시 적용한 Chrome computed style에서 `background rgba(244, 244, 244, 0.66)`과 `backdrop-filter blur(18px) saturate(1.1)`을 확인했습니다.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `git diff --check`: 통과.

## 2026-07-21 Work Detail Arrow, Content Width, and Image Ratio

### 요구사항
- Featured Work CTA와 같은 sweep 애니메이션을 작업물 상세 상단 바의 뒤로가기 화살표에도 적용합니다.
- 880px로 안쪽에 제한된 상세 본문 컨테이너를 1180px main content 폭과 맞춥니다.
- 단일 이미지 블록은 원본 비율을 유지하고, 갤러리 블록만 1:1 crop을 사용하도록 구분합니다.

### 구현
- `src/pages/work/[slug].astro`, `src/styles/work-detail.css`
  - 뒤로가기 화살표를 별도 span으로 감싸고 Featured 화살표와 같은 520ms sweep을 좌측 이동 방향으로 적용했습니다.
  - 키보드 `focus-visible`에서도 동일한 피드백을 제공하고 reduced-motion 전역 규칙을 따릅니다.
  - `.work-blocks`를 100% 폭과 좌측 정렬로 변경해 1180px `.work-detail`과 같은 경계를 사용합니다. heading/copy/quote의 개별 680/880/1080/100% 폭 옵션은 유지합니다.
  - 단일 `.work-block-image img`의 강제 480px 높이와 cover crop을 제거하고 `height:auto`, `min-height:0`, `object-fit:contain`으로 원본 비율을 유지합니다.
  - `.work-block-gallery-item`의 `aspect-ratio:1/1`, `object-fit:cover`는 그대로 유지했습니다.
- `src/styles/admin/preview.css`
  - 관리자 실시간 미리보기의 단일 이미지도 public page와 동일하게 원본 비율을 유지합니다. 갤러리 미리보기는 계속 1:1입니다.

### 검증
- 운영 `hexalabs` 페이지에 변경 DOM/CSS를 임시 적용한 Chrome 검사:
  - main width 1180px, block container width 1180px, left offset 0px.
  - 단일 이미지 render size 1180 × 413.45px로 저장된 가로 비율을 유지.
  - hover 시 animation name `work-back-arrow-sweep` 확인.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test --test-name-pattern='admin login|saved work blocks' tests/integration/worker.integration.ts`: 관련 2 tests / 0 failures.
- `git diff --check`: 통과.

## 2026-07-21 Work Detail Topbar Backdrop Blur

### 요구사항
- 작업물 상세 페이지를 스크롤할 때 나타나는 고정 상단 바에 흰색 반투명 배경과 은은한 뒤 배경 블러를 복원합니다.

### 구현
- `src/pages/work/[slug].astro`
  - 고정 상단 바를 cover 내부에서 바로 다음 sibling으로 이동했습니다. 상단 바가 cover의 흰 fade layer가 아니라 실제 스크롤 콘텐츠를 backdrop으로 샘플링합니다.
- `src/styles/work-detail.css`
  - 상단 바 전용 `::before` 배경 레이어에 흰색 78%, `blur(18px) saturate(110%)`를 적용했습니다.
  - Safari용 `-webkit-backdrop-filter`와 기존 180ms 등장 전환을 유지했습니다.
  - 버튼과 제목은 블러 레이어 위에 렌더링되도록 stacking order를 명시했습니다.

### 검증
- 운영 `hexalabs` 상세 페이지에 수정 DOM/CSS를 임시 주입한 Chrome 시각 검사에서 이미지 위 blur 합성을 확인했습니다.
- computed style: `background rgba(255, 255, 255, 0.78)`, `backdrop-filter blur(18px) saturate(1.1)`, opacity 1.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test --test-name-pattern='admin login|saved work blocks' tests/integration/worker.integration.ts`: 관련 2 tests / 0 failures.
- `git diff --check`: 통과.

## 2026-07-21 Public Content Degraded-State Observability

### 요구사항
- D1 조회 오류가 starter content로 조용히 대체되어 운영 장애를 발견하기 어려운 문제를 개선합니다.
- 로컬 개발과 일시 장애 상황의 public fallback은 유지하되, 장애 응답이 정상 콘텐츠처럼 캐시되지 않게 합니다.

### 구현
- `src/lib/content-response.ts`
  - public content 조회 출처를 `database | fallback`으로 표현하는 결과 타입을 추가했습니다.
  - 모든 public 응답에 `x-portfolio-content-source` 진단 헤더를 적용할 수 있게 했습니다.
  - fallback 응답에는 browser/CDN/Cloudflare용 `no-store` 헤더를 함께 적용합니다.
- `src/lib/content.ts`
  - `getHomeContentResult`, `getWorkBySlugResult`가 데이터와 조회 출처를 함께 반환합니다.
  - 기존 `getHomeContent`, `getWorkBySlug`는 호환 wrapper로 유지했습니다.
  - D1 오류의 구조화된 `portfolio.content.read_failed` 로그와 starter content fallback 동작은 유지합니다.
- `src/components/HomePage.astro`, `src/pages/work/[slug].astro`, `src/pages/sitemap.xml.ts`
  - 조회 출처를 응답 헤더에 반영합니다. D1 정상 응답은 기존 캐시 정책을 유지하고 fallback만 `no-store`로 전환합니다.
- `src/pages/api/health.ts`
  - Cache API를 거치지 않고 D1 binding과 public content 필수 테이블 6개의 준비 상태를 직접 확인합니다.
  - 정상은 `200 { status: "ok" }`, 장애는 `503 { status: "degraded" }`와 `no-store`로 응답합니다.
- `src/middleware.ts`
  - fallback 표시가 있는 HTML은 Cloudflare Cache API에 저장하지 않습니다. D1 복구 뒤 임시 콘텐츠가 edge TTL 동안 남는 문제를 차단했습니다.
- `tests/content-response.test.ts`, `tests/integration/worker.integration.ts`
  - 정상/장애 응답 헤더와 cache policy를 단위 테스트합니다.
  - 격리된 테스트 D1을 의도적으로 사용 불가 상태로 만든 뒤 fallback이 두 번 모두 새로 생성되고 Cache API에 들어가지 않는지 검증합니다.

### 운영 확인
- Cloudflare Worker 로그에서 `portfolio.content.read_failed`로 D1 조회 오류를 검색할 수 있습니다.
- D1 binding/schema 상태를 즉시 점검하려면 `/api/health`의 HTTP 200 여부를 확인합니다. 장애 시 `portfolio.health.database_unavailable` 구조화 로그도 남습니다.
- 외부 상태 점검에서는 `x-portfolio-content-source: database`를 정상 조건으로 사용할 수 있습니다. `fallback`이면 사이트는 표시되지만 D1 조회가 저하된 상태입니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `npm run test:unit`: 58 tests / 0 failures.
- `node --test tests/integration/*.integration.ts`: 9 tests / 0 failures. 권한 허용 상태에서 Wrangler와 Chrome 통합 검사를 완료했습니다.
- `git diff --check`: 통과.

### 남은 확인
- 현재 Cloudflare Observability는 전체 로그 수집이 활성화되어 있습니다. 별도 외부 uptime monitor를 추가할 경우 `/api/health`의 HTTP 200을 검사하고, public fallback 여부는 `/`의 `x-portfolio-content-source`로 보조 확인할 수 있습니다.

## 2026-07-21 Repository Backup Hygiene Audit

### 요구사항
- 약 721MB로 지적됐던 저장소와 R2/D1 백업 추적 상태를 점검하고, Git 이력을 훼손하지 않는 범위에서 용량을 정리합니다.

### 점검 및 정리
- 현재 작업 폴더의 대부분은 Git에 포함되지 않는 로컬 개발 데이터입니다.
  - `node_modules.nosync`: 약 532MB. iCloud 충돌을 피하기 위한 의존성 디렉터리이므로 유지했습니다.
  - `.wrangler`: 약 98MB. 로컬 D1/R2 테스트 데이터이며 `.gitignore` 대상이므로 유지했습니다.
  - 정리 전 `.git`: 약 57MB.
- 현재 Git 트리에는 `d1-backups/`와 `r2-backups/`가 없고, 두 경로 모두 `.gitignore`에 등록되어 있습니다. 현재 추적 중인 파일에서 운영 백업이나 대용량 미디어도 발견되지 않았습니다.
- 과거 커밋에는 D1/R2 백업 blob이 남아 있지만, 이를 제거하려면 Git 이력 재작성과 원격 강제 푸시가 필요합니다. 기존 clone과 작업 브랜치에 영향을 주므로 이번 작업에서는 이력을 변경하지 않았습니다.
- 표준 `git gc`를 실행해 loose object를 pack으로 압축하고 오래된 unreachable object를 정리했습니다.
  - `.git`: 약 57MB -> 41MB
  - 전체 작업 폴더: 약 692MB -> 676MB
  - 정리 후 loose object 0개, pack 2개/40.42MiB, garbage 0개

### 검증
- `git count-objects -vH`: loose object와 garbage 0개.
- `git fsck --full`: 유효한 commit/blob 참조 손상 없음. Git 기본 유예 기간 안의 dangling tree 6개는 복구 가능성을 위해 유지됐으며 용량 영향은 미미합니다.
- `git status --short`: 정리 직후 source 변경 없음.
- 현재 HEAD의 가장 큰 추적 파일은 생성된 Worker 타입 선언, lockfile, 프로필 이미지 수준이며 백업 파일은 없습니다.

### 남은 확인
- GitHub 저장소 용량을 더 줄여야 하는 명확한 운영상 이유가 생길 때만 과거 백업 blob 제거를 별도 작업으로 검토합니다. 이 작업은 모든 clone에 영향을 주는 이력 재작성이라 사용자 명시 승인 없이 실행하지 않습니다.
- 다음 유지보수 순서는 D1 장애를 starter content로 조용히 대체하는 `src/lib/content.ts`의 운영 관측성을 개선하는 것입니다.

## 2026-07-21 Admin CSS Module Split

### 요구사항
- 1,600줄 이상인 `src/styles/admin.css`를 shell, form, work editor/preview, responsive 책임 단위로 분리합니다.
- CSS cascade와 모든 관리자 화면의 기존 시각 결과를 유지합니다.

### 구현
- `src/styles/admin.css`
  - charset과 다섯 partial import만 유지하는 7줄 진입점으로 변경했습니다.
- `src/styles/admin/shell.css`
  - 로그인, sidebar, 공통 버튼, toast와 topbar 등 관리자 shell 스타일을 담당합니다.
- `src/styles/admin/forms.css`
  - panel, form field, profile link, timeline과 공통 action 스타일을 담당합니다.
- `src/styles/admin/works-editor.css`
  - Works 목록, 기본/미디어/블록 에디터, rich-text toolbar와 sticky action 스타일을 담당합니다.
- `src/styles/admin/preview.css`
  - 편집기 splitter, 실시간 preview hero와 상세 블록 스타일을 담당합니다.
- `src/styles/admin/responsive.css`
  - 1320px/980px/660px 반응형 규칙과 모바일 drawer를 담당합니다.
- 선언 순서는 기존 파일 순서 그대로 유지했습니다. 기존 `admin.css` 본문과 다섯 partial 연결 결과의 SHA-256이 `6dd85da6a6dfc875e3be7dcc7a6a9d5230fcc7961d10eb049e95c8bfe2285fb1`로 일치합니다.
- `tests/integration/worker.integration.ts`
  - 실제 관리자 로그인 후 desktop shell, sidebar, Works 목록, editor와 preview의 computed layout을 확인하는 브라우저 회귀 테스트를 추가했습니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test tests/*.test.ts`: 55 tests / 0 failures.
- `npm run test:integration`: 7 tests / 0 failures. 관리자 CSS shell/editor 렌더링을 포함해 확인했습니다.
- `git diff --check`: 통과.

### 남은 확인
- `admin.css`는 1,640줄에서 7줄 진입점으로 줄었고 가장 큰 partial도 `works-editor.css` 533줄입니다.
- 다음 유지보수 순서는 저장소 크기와 backup 추적 상태를 다시 점검해 R2/D1 운영 백업이 Git에 남아 있지 않은지 확인하는 것입니다.

## 2026-07-21 Home Featured Controller Split

### 요구사항
- 대표 작업물 패널 활성화, dot 이동, 스크롤 높이와 Gallery 진입 dim 효과를 Featured 전용 컨트롤러로 분리합니다.
- 대표 작업물 전환 시 링크 접근성 상태와 기존 스크롤 위치 계산을 유지합니다.

### 구현
- `src/scripts/home/home-featured.ts`
  - 대표 작업물 section/stage/panel/dot DOM과 활성 인덱스 및 section 위치 캐시를 소유합니다.
  - 스크롤 진행률에 따른 패널 활성화, dot 클릭 이동, `aria-hidden`/`aria-pressed`/링크 `tabindex` 동기화를 관리합니다.
  - viewport 변경 시 featured scroll height와 geometry를 갱신하고 Gallery 진입 dim GSAP 애니메이션을 등록합니다.
  - dot 점프 blur timeout을 Astro 페이지 cleanup에서 해제합니다.
- `src/scripts/home-page.ts`
  - Featured 내부 상태와 이벤트를 제거하고 `syncScrollHeight`, `updateGeometry`, `cleanup` API만 전체 수명 주기에 연결했습니다.
  - 파일 크기는 563줄에서 475줄로 줄었습니다. 초기 1,119줄과 비교하면 644줄이 역할별 모듈로 이동했습니다.
- `tests/integration/worker.integration.ts`
  - 대표 작업물 2개를 생성한 뒤 두 번째 dot 클릭 시 활성 패널과 모든 ARIA 상태가 일치하는 브라우저 회귀 테스트를 추가했습니다.
  - 화면 밖 요소의 Playwright actionability 대기를 제거해 해당 테스트를 약 13초에서 0.9초로 줄였습니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test tests/*.test.ts`: 55 tests / 0 failures.
- `npm run test:integration`: 6 tests / 0 failures. Featured dot/panel 전환을 포함해 확인했습니다.
- `git diff --check`: 통과.

### 남은 확인
- 홈 모션 엔트리는 475줄로 축소되어 Intro, route, viewport refresh를 조정하는 상위 orchestration 역할에 가까워졌습니다.
- 다음 큰 유지보수 대상은 1,600줄 이상인 `src/styles/admin.css`를 shell, form, work editor/preview, responsive 단위로 분리하는 작업입니다.

## 2026-07-21 Home Identity Controller Split

### 요구사항
- `home-page.ts`에 남은 About/Career 스크롤 좌표, 전환 타임라인과 Career 카드 포커스 로직을 독립 컨트롤러로 분리합니다.
- `/about`, `/career` 직접 진입, 모바일 단계 전환, Career 카드 클릭과 기존 스크롤 속도를 유지합니다.

### 구현
- `src/scripts/home/home-identity.ts`
  - About 로고/본문 등장과 About→Career 전환 GSAP 타임라인을 소유합니다.
  - Identity 및 Career 스크롤 좌표, 카드별 중심 진행률, 포커스 스타일과 활성 ARIA 상태 계산을 한곳으로 옮겼습니다.
  - Career 카드 클릭 이동, 직접 진입 상태, 모바일 Career 목록 표시 시점과 animation frame cleanup을 관리합니다.
  - 외부에는 `updateGeometry`, `getCareerEntryTop`, `getIdentityScrollForProgress`, `playAboutIntro`, `showCareerInitial` 등 제한된 API만 제공합니다.
- `src/scripts/home-page.ts`
  - Identity 내부 DOM과 상태를 제거하고 전용 컨트롤러를 전체 ScrollTrigger/resize/route 수명 주기에 연결했습니다.
  - ScrollTrigger 생성 전 Work/패널 좌표 캐시를 먼저 채워 초기 start/end 계산 순서를 보존했습니다.
  - 파일 크기는 884줄에서 563줄로 줄었습니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test tests/*.test.ts`: 55 tests / 0 failures.
- `npm run test:integration`: 5 tests / 0 failures. `/about`, `/career`, 모바일 휠 이동과 Career 활성 항목을 포함해 확인했습니다.
- `git diff --check`: 통과.

### 남은 확인
- `home-page.ts`의 다음 독립 영역은 featured panel 활성화, dot 이동, 스크롤 높이와 Gallery 진입 dim 처리를 묶은 Featured 컨트롤러입니다.

## 2026-07-21 Home Motion Module Split

### 요구사항
- 유지보수 개선의 다음 순서로 1,100줄 이상인 `src/scripts/home-page.ts`를 섹션과 컨트롤러 책임 단위로 분리합니다.
- Intro 타입라이터, 대표 작업물 명암 판정, WORK 갤러리 필터의 기존 동작과 Astro 페이지 전환 시 정리를 유지합니다.

### 구현
- `src/scripts/home/home-typewriter.ts`
  - 일반 문자열 타이핑, 중첩 마크업 텍스트 복원/타이핑, 실행 세대 구분과 타이머 정리를 전용 컨트롤러로 분리했습니다.
  - 홈 페이지 cleanup에서 모든 타이핑 타이머와 보관한 텍스트 참조를 해제합니다.
- `src/scripts/home/home-work.ts`
  - 대표 작업물 이미지의 자동 흑백 텍스트 대비 계산과 WORK 갤러리 FLIP 필터 애니메이션을 분리했습니다.
  - 카테고리 탭의 클릭, `ArrowLeft`/`ArrowRight`/`Home`/`End` 키보드 이동과 live status 갱신을 함께 관리합니다.
  - 필터 대상은 `#work-gallery-grid` 내부 작업물 타일로 한정했습니다.
- `src/scripts/home-page.ts`
  - 새 컨트롤러를 초기화하고 page AbortSignal 및 cleanup 수명 주기에 연결했습니다.
  - 파일 크기는 1,119줄에서 884줄로 줄었습니다.
- `tests/integration/worker.integration.ts`
  - 실제 브라우저에서 UI/UX 필터 결과, ARIA 연결, 상태 메시지와 방향키 탭 이동을 검증하는 회귀 테스트를 추가했습니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test tests/*.test.ts`: 55 tests / 0 failures.
- `npm run test:integration`: 5 tests / 0 failures. 기존 로그인/D1/R2/모바일 스크롤과 새 WORK 필터 흐름을 확인했습니다.
- `git diff --check`: 통과.

### 남은 확인
- `home-page.ts`에는 About/Career 스크롤 좌표, 타임라인 진행률, featured panel 전환과 route 동기화가 연결되어 있습니다. 다음 분리 단계는 공유 geometry API를 먼저 정의한 뒤 Identity와 Featured 컨트롤러를 분리하는 것입니다.

## 2026-07-21 Admin Screen and Controller Split

### 요구사항
- 유지보수 개선의 다음 순서로 비대해진 `AdminApp.tsx`를 화면과 컨트롤러 책임 단위로 분리합니다.
- 기존 관리자 저장, 업로드, 정렬, 실시간 미리보기와 편집기 분할 크기 조절 동작은 유지합니다.

### 구현
- `src/components/admin/AdminPanels.tsx`
  - Profile, Timeline, Works 목록 화면을 `ProfilePanel`, `TimelinePanel`, `WorksListPanel`로 분리했습니다.
  - 입력 상태와 저장/삭제/드래그 콜백은 부모에서 전달해 기존 데이터 흐름을 유지했습니다.
- `src/components/admin/WorkEditorPanel.tsx`
  - 작업물 기본 정보, 미디어 업로드, 지연 로딩 블록 에디터, 실시간 미리보기와 드래그 가능한 분할 바를 하나의 화면 컴포넌트로 분리했습니다.
  - 에디터 로딩 오류 경계도 편집 화면과 함께 이동했습니다.
- `src/components/admin/AdminApp.tsx`
  - 화면 JSX를 새 패널에 위임하고 `useAdminController`가 제공하는 상태와 이벤트만 조립하도록 정리했습니다.
  - 파일 크기는 최초 1,111줄에서 화면 분리 후 771줄, 컨트롤러 분리 후 229줄로 줄었습니다.
- `src/components/admin/useAdminController.ts`
  - 인증, API 요청, 저장 상태, 공개 캐시 결과 알림, 업로드, 작업물 정렬, 이탈 확인, 편집기 스크롤 복원과 미리보기 크기 조절을 전용 훅으로 옮겼습니다.
  - 화면 컴포넌트에는 렌더링에 필요한 상태와 이벤트 함수만 반환합니다.

### 검증
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare production build complete.
- `node --test tests/*.test.ts`: 55 tests / 0 failures.
- `npm run test:integration`: 4 tests / 0 failures. 관리자 로그인, D1 저장 후 공개 렌더링, R2 업로드, 모바일 스크롤 흐름을 확인했습니다.
- `git diff --check`: 통과.

### 남은 확인
- `useAdminController.ts`는 현재 644줄입니다. 관리자 기능이 크게 늘어날 때 Profile/Timeline/Works 도메인 훅으로 추가 분리할 수 있지만, 현 단계에서는 서로 연결된 저장·이탈 상태를 한곳에서 관리하는 편이 안전합니다.
- 다음 대형 유지보수 대상은 1,100줄 이상인 `src/scripts/home-page.ts`의 섹션별 모션 컨트롤러 분리입니다.

## 2026-07-14 Responsive Images, Deferred Motion, and Astro 7

### 요구사항
- 이전 전체 검수에서 남은 반응형 이미지, 초기 JavaScript, 접근성/성능, 운영 설정, Astro 7 항목을 모두 개선합니다.
- Cloudflare Images 없이 R2에 자체 WebP 변형본을 저장하는 1번 방식을 사용합니다.
- 모든 개선이 끝난 뒤 한 번에 커밋할 수 있도록 중간 커밋은 만들지 않습니다.

### 구현
- `migrations/0005_asset_variants.sql`, `src/lib/responsive-images.ts`, `src/lib/image-upload.ts`
  - `asset_variants` 스키마와 640/1280/1920/2560 변형 정책을 추가했습니다.
  - 관리자 브라우저가 WebP 변형본을 만들고 API가 파일 시그니처/매니페스트/총 용량을 검증합니다.
  - R2 업로드와 D1 batch 저장을 연결하고 실패 시 새 R2 키를 롤백합니다. GIF는 단일 원본을 유지합니다.
- `src/lib/content.ts`, `src/lib/admin-data.ts`, public Astro components
  - 페이지별 asset ID를 한 번에 조회해 변형본을 붙이고 모든 공개 이미지 컨텍스트에 `srcset`/`sizes`를 적용했습니다.
- `scripts/backfill-image-variants.mjs`
  - dry-run/apply, 기존 너비 건너뛰기, 치수 누락 원본 검사, 실패 롤백을 지원합니다.
  - 운영 D1 migration 적용 후 33개 자산 치수를 복구하고 새 WebP 104개(22,213,010 bytes)를 R2에 저장했습니다. 원본은 변경하지 않았습니다.
- `src/lib/motion-loader.ts`, `PublicLayout.astro`, `HomePage.astro`
  - 홈의 GSAP/ScrollTrigger/Lenis를 입력 또는 idle 시점의 동적 import로 분리하고 상세 페이지에서 다운로드하지 않도록 했습니다.
  - reduced-motion 직접 진입과 모션 청크 실패 fallback을 추가했습니다.
- 패키지/Cloudflare 타입
  - Astro 7.0.9, Cloudflare adapter 14.1.3, React adapter 6.0.1, Wrangler 4.110.0, TypeScript 6.0.3으로 정렬했습니다.
  - Wrangler 생성 `worker-configuration.d.ts`로 전환하고 `@cloudflare/workers-types`를 제거했습니다.
  - dev 서버와 Wrangler 4.105 사이의 `_cf_ALARM` 메타데이터 충돌이 버전 정렬 후 해소됐습니다.

### 검증
- `node --test tests/*.test.ts`: 53 tests / 0 failures.
- `npm run cf:types`: 성공.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, production build complete.
- `npx wrangler d1 execute portfolio-db --local --command "SELECT COUNT(*) AS works FROM works" --json`: dev 서버 동시 실행 상태에서 성공, works 7.
- 운영 D1: dimensioned assets 33, variants 104, variant bytes 22,213,010.
- 운영 R2 샘플: valid WebP, 1280x1280.
- 감사 상세: `docs/audits/2026-07-14-accessibility-performance.md`.

### 남은 확인
- 현재 배포본 `/sitemap.xml`은 404입니다. 다음 커밋/배포 후 200 및 published work 목록을 확인하고 Search Console에 제출해야 합니다.
- 인앱 브라우저 런타임 연결 실패로 전체 키보드 순회는 자동화하지 못했습니다. 배포 후 실제 브라우저 수동 점검이 남아 있습니다.
- 관리자 PBKDF2 비밀번호는 새 비밀번호를 전달받지 않아 회전하지 않았습니다.

## 2026-06-17 Work Detail Stale Public Cache Follow-up

### 요구사항
- Admin에서 `ROii HMI UI 디자인`으로 저장했는데 공개 `/work/roii-hmi` 상세가 예전 제목/연도/역할로 보이는 문제를 조사합니다.
- 같은 현상이 여러 프로젝트에서 생길 수 있으므로 저장 후 공개 상세 반영 경로를 더 안정화합니다.
- Superpowers systematic debugging/TDD 흐름에 따라 원인 확인, 테스트 작성, 구현, 검증을 진행합니다.

### 원인
- 공개 상세 페이지는 `src/pages/work/[slug].astro`에서 `getWorkBySlug(slug)` 결과를 그대로 렌더링합니다.
- 운영 URL `https://dolbakggom.com/work/roii-hmi`를 새로 요청했을 때 `x-portfolio-cache: MISS`였고, HTML은 admin 입력값과 일치했습니다.
  - title: `ROii HMI UI 디자인`
  - year: `2024~2025`
  - role: `Figma, Adobe Illustrator`
  - client: `(주)오토노머스에이투지`
- 따라서 현재 D1/렌더러는 올바른 값을 만들고 있으며, 사용자가 본 화면은 저장 당시 남아 있던 edge/browser HTML 캐시 또는 이전 배포의 캐시 결과로 판단했습니다.
- 기존 `deletePublicHtmlCache(...)`는 Worker Cache API로 저장 요청을 처리한 edge cache를 지우지만, 다른 Cloudflare PoP에 남은 HTML까지 전역으로 즉시 제거하지는 못합니다.

### 구현
- `src/lib/public-cache.ts`
  - `createPublicHtmlPurgeUrls(...)`를 추가해 cache path들을 절대 URL로 변환하고 중복 제거합니다.
- `src/lib/cloudflare-purge.ts`
  - `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_CACHE_PURGE_TOKEN` 또는 `CF_*`/`CLOUDFLARE_API_TOKEN` 조합을 읽어 Cloudflare file purge 요청을 만들도록 추가했습니다.
  - purge files 요청은 30개 단위로 나눕니다.
- `src/lib/admin-cache.ts`
  - admin 저장 후 기존 Worker Cache API 삭제와 선택적 Cloudflare 전역 file purge를 함께 실행합니다.
  - purge 실패나 env 미설정이 admin 저장 성공 자체를 막지 않도록 `Promise.allSettled(...)`로 방어합니다.
- `src/pages/api/admin/profile.ts`, `timeline/*`, `works/*`, `reorder.ts`
  - 기존 `deletePublicHtmlCache(...)` 호출을 `purgePublicHtmlCache(...)`로 교체했습니다.
- `.dev.vars.example`, `AGENTS.md`
  - 선택적 전역 purge env 이름을 문서화했습니다.
- `tests/public-cache.test.ts`, `tests/cloudflare-purge.test.ts`
  - public purge URL 생성, Cloudflare purge credential/batch/request 생성 회귀 테스트를 추가했습니다.

### 검증
- `node --test tests/cloudflare-purge.test.ts tests/public-cache.test.ts` 통과: 8 tests / 0 failures.
- `git diff --check` 통과.
- `npm run build` 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

### 남은 확인
- 전역 purge는 배포 후 Cloudflare Worker 환경에 `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_CACHE_PURGE_TOKEN`이 설정되어 있어야 작동합니다.
- 토큰은 Cloudflare Zone Cache Purge 권한만 가진 좁은 토큰으로 설정하는 것이 좋습니다.
- env가 없으면 기존 Worker Cache API 삭제만 수행하므로, 다른 PoP의 기존 캐시는 최대 기존 TTL 영향을 받을 수 있습니다.

## 2026-06-16 Admin Save Public HTML Cache Invalidation

### 요구사항
- admin에서 작업물/프로필/이력 내용을 저장한 뒤 퍼블리싱된 공개 홈페이지 반영이 늦는 이유를 히스토리 기준으로 확인합니다.
- 기존 지연을 둔 이유와 지연이 없을 때의 문제점을 정리하고, 성능 캐시는 유지하면서 저장 직후 반영 지연을 줄입니다.
- Superpowers systematic debugging/TDD 흐름에 맞춰 원인 확인, 회귀 테스트, 구현, 검증을 진행합니다.

### 원인
- 2026-05-27 `PageSpeed LCP Font and Public HTML Cache Pass`에서 PageSpeed 모바일의 public HTML 비캐시/TTFB 병목을 줄이기 위해 `/`, `/about`, `/career`, `/work`, `/work/:slug` GET HTML에 Cloudflare Cache API를 적용했습니다.
- edge TTL은 10분, stale-while-revalidate는 24시간으로 설정되어 있어 CMS 저장 직후 공개 페이지가 최대 10분 늦게 보일 수 있다는 주의사항이 이미 남아 있었습니다.
- admin mutation API에는 저장 후 public HTML cache key를 삭제하는 경로가 없어, 정상적으로 저장되어도 기존 HTML 캐시가 TTL 동안 유지될 수 있었습니다.
- 빌드 검증이 멈추던 직접 원인은 iCloud Drive 안의 `node_modules`에 `* 2` 충돌 디렉터리가 대량 생성되어 dependency ESM 파일 로딩이 비정상적으로 느려진 것이었습니다.
  - 예: `node_modules/zod/v3 2`, `node_modules/zod/v4 2`, `node_modules/@astrojs/* 2`, `node_modules/.bin/* 2`.
  - 충돌 상태에서는 `import("zod")`만 22초가 걸렸고, `astro check`는 4분 이상 CPU 사용 없이 I/O 대기 상태에 가까웠습니다.

### 구현
- `src/lib/public-cache.ts`
  - middleware와 같은 형태의 HTML cache key(`GET`, `accept: text/html`)를 생성하는 helper를 추가했습니다.
  - home route alias(`/`, `/about`, `/career`, `/work`)와 work detail route(`/work/:slug`) 삭제 대상을 계산합니다.
  - Cloudflare `caches.default.delete(...)`를 사용해 admin 저장 요청 직후 관련 public HTML 캐시를 삭제합니다.
- `src/pages/api/admin/profile.ts`, `timeline/*`, `works/*`, `reorder.ts`
  - 프로필/이력 저장은 home route alias 캐시를 삭제합니다.
  - work 생성/수정/삭제/정렬 및 block reorder는 home route alias와 work detail 캐시를 삭제합니다.
  - work slug 변경/삭제 시 예전 slug의 `/work/:oldSlug` 캐시도 함께 삭제합니다.
- `tests/public-cache.test.ts`
  - Node 내장 `node:test`로 cache path 계산과 middleware cache key shape를 회귀 테스트합니다.
- local dependency hygiene
  - 충돌된 `node_modules`를 삭제하고 `npm ci`로 재설치했습니다.
  - 재설치된 dependency를 `node_modules.nosync`로 옮기고 `node_modules -> node_modules.nosync` symlink를 만들어 iCloud sync 충돌 재발 가능성을 줄였습니다.
  - `.gitignore`에 `node_modules.nosync`를 추가했습니다.
- `tsconfig.json`
  - `.nosync` 전환 후 TypeScript가 `node_modules.nosync`를 workspace source처럼 읽어 OOM을 내는 문제를 막기 위해 include를 `src/**/*`, `.astro/types.d.ts`, `.astro/content.d.ts`, `astro.config.mjs`로 좁혔습니다.
  - `node_modules.nosync`, `tests`, `.wrangler`, backup folders를 exclude에 추가했습니다.

### 검증
- `find node_modules.nosync -maxdepth 3 -name '* 2' -print` 결과 없음.
- `node --input-type=module -e 'console.time("zod"); await import("zod"); console.timeEnd("zod");'` 결과 `zod: 30.274ms`.
- `node --test tests/public-cache.test.ts` 통과: 3 tests / 0 failures.
- `git diff --check` 통과.
- `npm run build` 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

### 남은 확인
- Cloudflare Cache API 삭제는 요청을 처리한 edge cache를 즉시 비우는 방식입니다. 다른 PoP에 남은 캐시까지 전 세계적으로 즉시 제거해야 한다면 Cloudflare Zone Purge API(`CF_ZONE_ID`, purge token 등)를 추가해야 합니다.
- 현재 설계는 PageSpeed/TTFB 보호를 위해 10분 TTL과 SWR은 유지하고, admin 저장 직후 반영 지연만 줄이는 절충안입니다. TTL을 완전히 제거하면 모든 공개 페이지 요청이 Worker 렌더/D1 조회로 돌아가 성능 병목이 재발할 수 있습니다.
- iCloud Drive 안에서 개발하는 동안 `node_modules`가 실제 디렉터리로 돌아가거나 `* 2` 충돌 폴더가 다시 생기면 빌드가 다시 매우 느려질 수 있습니다. `node_modules`는 `node_modules.nosync` symlink 상태를 유지합니다.

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
- `public/og-image.svg`, `public/og-image.png`
  - 인트로 화면과 같은 검정 배경, 중앙 로고, `Beyond the Answer` 타이틀, 초록 점 구성의 1200x630 OG 이미지를 만들었습니다.
  - 공유 플랫폼 호환성을 위해 기본 메타 이미지는 PNG를 사용하고, SVG는 원본 소스로 남겼습니다.

### 검증
- `git diff --check` 통과.
- `npm run build`
  - 샌드박스 내부 첫 실행은 Cloudflare Vite plugin의 `0.0.0.0:9229` bind `EPERM`으로 실패했습니다.
  - 승인된 재실행에서 `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete 확인했습니다.

### 남은 주의점
- 카카오톡, Slack, Discord 등은 URL 미리보기 캐시가 강하게 남을 수 있습니다. 배포 후에도 이전 이미지나 설명이 보이면 각 서비스의 캐시 갱신 도구를 사용하거나 쿼리스트링을 붙인 URL로 다시 테스트해야 합니다.

## 2026-06-09 Mobile Career Point Typography Stabilization

### 요구사항
- 모바일 Career point에서 선택 전/후 텍스트 크기가 달라져 폰트가 왔다 갔다 하는 느낌을 줄입니다.
- 선택된 point의 제목은 줄바꿈을 허용하더라도 기존 큰 크기를 유지하고, 설명 텍스트만 작은 크기로 유지합니다.

### 구현
- `src/styles/global.css`
  - 모바일 timeline card의 상세 제목(`.timeline-card-details-inner h3`)을 active 여부와 무관하게 `28px`로 고정했습니다.
  - 상세 설명(`.timeline-card-details-inner span`)은 `16px`로 유지해 펼침 상태에서도 title/description 계층이 안정적으로 보이게 했습니다.

### 검증
- `git diff --check` 통과.

## 2026-06-11 Admin Profile Image Save Reliability

### 요구사항
- 배포 admin에서 프로필 이미지를 업로드하고 `Save profile`을 눌렀는데 공개 페이지에 반영되지 않은 원인을 확인합니다.
- 같은 문제가 다시 발생하지 않도록 프로필 이미지 저장 흐름을 보강합니다.

### 원인
- 원격 D1 확인 결과, R2/`assets`에는 프로필 이미지가 업로드되어 있었지만 `profile.portrait_asset_id`가 `null`이어서 공개 페이지가 fallback 이미지(`/assets/figma/profile-guitar.png`)를 사용하고 있었습니다.
- admin UI는 프로필 이미지 업로드와 프로필 저장이 분리되어 있고, 업로드 직후 React state 갱신 타이밍과 Save 클릭 타이밍이 엇갈리면 저장 payload에 이전 `portraitAssetId`가 들어갈 수 있는 구조였습니다.

### 구현
- `src/components/admin/AdminApp.tsx`
  - 최신 profile state를 보관하는 `profileRef`를 추가하고, `saveProfile()`이 렌더 closure의 오래된 `profile` 대신 `profileRef.current`를 저장하도록 변경했습니다.
  - 프로필 이미지 업로드 성공 시 `portraitAssetId`와 `portrait`를 state와 ref에 동시에 반영합니다.
  - 이미지 업로드 중에는 profile file input과 `Save profile` 버튼을 비활성화하고, 업로드 중 저장 시도를 막았습니다.

### 운영 반영
- 원격 D1의 `profile.portrait_asset_id`를 최신 업로드 asset `ff99b6f6-b9d8-40ac-9b94-292af2e3fe9c`로 직접 연결했습니다.
- `https://dolbakggom.com/about` HTML에서 새 `/media/uploads/2026/06/...img_3872-sdr.jpg` 프로필 이미지가 내려오는 것을 확인했습니다.

### 검증
- `git diff --check` 통과.

## 2026-06-11 Mobile Career Timeline Stage Separation

### 요구사항
- 모바일 Career 화면에서 timeline 항목이 상단 Career 소개 문구와 겹치지 않도록 합니다.
- 소개 문구가 먼저 보인 뒤 디졸브로 사라지고, 그 다음 timeline이 여백 있는 풀 화면 영역을 쓰도록 단계감을 분리합니다.

### 구현
- `src/components/HomePage.astro`
  - 모바일 전용 `mobileCareerListStartProgress`를 추가해 Career 소개 문구가 나온 뒤 timeline list가 시작되도록 list 진입 시점을 늦췄습니다.
  - 모바일 Career timeline 시작 위치 계산도 새 모바일 list 진입 progress를 기준으로 맞췄습니다.
  - Career 소개문구 체류량은 About 체류량(`aboutHoldEndProgress`)과 동일하게 맞췄습니다.
- `src/styles/global.css`
  - 모바일에서 `.is-career-list` 단계 전까지 timeline을 강제로 숨겨 GSAP inline opacity와 겹쳐 보이지 않게 했습니다.
  - `.is-career-list` 단계에서는 timeline을 중앙 기준, 여백 있는 큰 viewport 영역(`min(84svh, 720px)`)으로 표시하도록 조정했습니다.
  - Career copy와 timeline 전환에 짧은 opacity/blur/transform transition을 부여해 단계 전환이 abrupt하게 보이지 않도록 했습니다.

### 검증
- `git diff --check` 통과.

## 2026-06-11 Career Point Scroll-Scrub Refinement

### 요구사항
- About → Career 전환처럼 Career point 전환도 트리거식으로 끊기지 않고 스크롤 progress에 맞춰 연속적으로 재생되도록 합니다.

### 구현
- `src/components/HomePage.astro`
  - Career timeline progress 계산에서 카드별 focus weight를 `--timeline-detail-row`, `--timeline-dot-scale`, `--timeline-dot-accent-opacity`까지 전달하도록 확장했습니다.
  - `setActiveTimeline()`은 `aria-current`와 현재 항목 상태 관리용으로 유지하고, 시각 전환은 CSS 변수 기반으로 분리했습니다.
- `src/styles/global.css`
  - timeline detail 영역의 높이, opacity, y 이동이 scroll progress 변수에 따라 움직이도록 변경했습니다.
  - dot 강조를 base dot과 acid overlay dot으로 분리해 active class 전환이 아니라 scroll progress opacity/scale로 표현되게 했습니다.
  - dot/title의 transition을 제거해 ScrollTrigger scrub 입력과 CSS transition이 서로 늦게 따라가는 느낌을 줄였습니다.

### 검증
- `git diff --check` 통과.
- `npm run build` 통과.
  - `astro check`: 0 errors / 0 warnings / 0 hints.
  - `astro build`: complete.

## 2026-07-14 Admin Save And Publication Reliability

### 요구사항
- 사이트 전반 감사에서 확인한 개선점을 순서대로 적용합니다.
- 첫 단계로 작업물 저장의 부분 성공 가능성을 제거하고, 저장 후 공개 캐시 반영 상태를 관리자가 분명히 알 수 있게 합니다.

### 구현
- `src/lib/admin-data.ts`
  - 작업물 생성 시 기본 정보와 본문 블록 INSERT를 하나의 D1 batch로 실행하도록 변경했습니다.
  - 작업물 수정 시 기본 정보 UPDATE, 기존 블록 DELETE, 신규 블록 INSERT를 하나의 D1 batch로 묶어 기본 정보만 저장되는 부분 성공을 방지했습니다.
- `src/lib/public-cache.ts`, `src/lib/cloudflare-purge.ts`, `src/lib/admin-cache.ts`
  - Worker Cache API 삭제와 Cloudflare global purge가 `ok`/`skipped` 결과를 반환하도록 변경했습니다.
  - Cloudflare purge API가 HTTP 200과 함께 `success: false`를 반환하는 경우도 실패로 판정합니다.
  - 최종 게시 상태를 `purged`, `deferred`, `failed`로 구분해 API 호출자에게 전달합니다.
- `src/pages/api/admin/**`
  - profile, timeline, works, reorder 변경 응답에 `publication` 결과를 포함했습니다.
- `src/components/admin/AdminApp.tsx`, `src/styles/admin.css`
  - 저장 결과를 즉시 공개 반영, 최대 10분 지연, 캐시 갱신 실패로 구분해 안내합니다.
  - 데이터 저장에는 성공했지만 공개 반영이 지연되거나 실패한 경우 별도의 경고색 toast를 표시합니다.
- `tests/cloudflare-purge.test.ts`, `tests/public-cache.test.ts`
  - Cloudflare의 논리 실패 응답, 자격 증명 누락, Worker Cache runtime 부재에 대한 회귀 테스트를 추가했습니다.

### 검증
- `node --test tests/*.test.ts`: 11 tests passed.
- `git diff --check`: 통과.
- `npm run build`: `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete.

### 남은 주의점
- 이 변경은 배포 후부터 관리자 화면에 게시 상태가 표시됩니다.
- 다음 우선순위는 공개 이미지의 반응형 변환 및 전송량 절감입니다.

## 2026-07-14 Public Image Upload And Loading Optimization

### 요구사항
- 사이트 감사 후속 작업으로 홈 첫 진입의 이미지 전송량을 줄입니다.
- 이후 관리자가 업로드하는 이미지가 원본 해상도와 용량 그대로 공개되지 않게 합니다.

### 구현
- `src/lib/image-upload.ts`, `tests/image-upload.test.ts`
  - 이미지의 비율을 유지하며 최대 2560px 안에 맞추는 공용 계산 함수를 추가했습니다.
  - 16MB 업로드 제한과 허용 이미지 MIME 목록을 공용 상수로 정의했습니다.
- `src/components/admin/AdminApp.tsx`
  - JPG, PNG, WebP 정지 이미지를 최대 2560px, 품질 0.9 WebP로 변환한 뒤 업로드합니다.
  - GIF는 애니메이션 보존을 위해 원본을 유지하고 실제 크기 메타데이터를 함께 전송합니다.
  - SVG와 16MB 초과 이미지는 클라이언트에서 안내 후 차단합니다.
- `src/pages/api/admin/assets.ts`
  - 서버에서도 MIME allowlist와 16MB 제한을 검증합니다.
  - 업로드된 이미지의 width/height를 assets 테이블에 저장합니다.
- `src/lib/content.ts`, `src/lib/admin-data.ts`
  - 프로필뿐 아니라 작업물 thumbnail, featured thumbnail, hero에도 이미지 크기와 MIME 메타데이터를 전달합니다.
- `src/components/HomePage.astro`, `src/pages/work/[slug].astro`, `src/components/WorkBlocks.astro`
  - 이미지 크기 메타데이터를 HTML width/height 속성으로 출력해 레이아웃 이동을 줄였습니다.
  - `/` 첫 진입에서는 3MB 이상인 프로필 이미지를 실제 About 영역 진입 전까지 요청하지 않습니다.
  - `/about`, `/career` 직접 진입에서는 프로필 이미지를 eager/high priority로 바로 요청합니다.
  - 본문 이미지와 갤러리 이미지에도 저장된 크기 메타데이터를 반영합니다.

### 검증
- `node --test tests/*.test.ts`: 15 tests passed.
- `npm run build`: `astro check` 0 errors / 0 warnings / 0 hints, `astro build` complete.
- 로컬 `/` HTML에서 프로필 이미지가 `data-deferred-src`만 가지고 초기 `src`는 없는 것을 확인했습니다.
- 로컬 `/about` HTML에서 프로필 이미지가 `loading="eager"`, `fetchpriority="high"`로 출력되는 것을 확인했습니다.
- Chrome 1440x1000, 390x844 첫 화면 screenshot에서 기존 인트로 레이아웃이 유지되는 것을 확인했습니다.

### 남은 주의점
- 기존 R2 이미지는 자동으로 다시 인코딩되지 않습니다. 현재 3.44MB 프로필 이미지는 배포 후 admin에서 한 번 다시 업로드해야 최적화된 WebP asset으로 교체됩니다.
- Cloudflare Images 또는 Image Resizing binding을 도입하지 않았으므로 viewport별 다중 `srcset` 생성은 후속 선택 사항입니다.

## 2026-07-14 Public SEO, Sitemap, And Favicon

### 요구사항
- 사이트 전반 감사의 다음 단계로 검색엔진 중복 문서, 구조화 데이터, sitemap/robots, 파비콘 부재를 개선합니다.

### 구현
- `src/lib/seo.ts`, `src/layouts/BaseLayout.astro`, `src/layouts/PublicLayout.astro`
  - canonical URL, 안전한 JSON-LD 직렬화, sitemap XML 생성 로직을 공용화했습니다.
  - 공용 레이아웃에 SVG/ICO 파비콘과 구조화 데이터 출력을 추가했습니다.
  - 작업물 공유 이미지의 실제 width/height를 Open Graph 메타데이터에 반영합니다.
- `src/components/HomePage.astro`
  - `/about`, `/career`, `/work`는 진입용 별칭으로 유지하면서 canonical을 `/`로 통일해 동일 홈 문서의 중복 색인을 방지했습니다.
  - 홈에 `Person`과 `WebSite` JSON-LD를 추가했습니다.
- `src/pages/work/[slug].astro`
  - 각 공개 작업물에 고유 canonical과 `CreativeWork` JSON-LD를 추가했습니다.
- `src/pages/sitemap.xml.ts`, `public/robots.txt`
  - D1의 공개 작업물 목록을 반영하는 동적 sitemap을 추가하고 관리자 경로는 검색 로봇에서 제외했습니다.
- `public/favicon.svg`, `public/favicon.ico`
  - 포트폴리오 로고와 메인 accent를 사용한 브라우저 파비콘을 추가했습니다.
- `src/lib/public-cache.ts`
  - 작업물 추가, 수정, 삭제 시 `/sitemap.xml`도 캐시 purge 대상에 포함했습니다.
- `tests/seo.test.ts`, `tests/public-cache.test.ts`
  - sitemap 중복 제거/XML escaping, JSON-LD script escaping, sitemap purge 경로를 검증합니다.

### 검증
- `node --test tests/*.test.ts`: 17 tests passed.
- `npm run build`: `astro check` 0 errors, Cloudflare server build complete.
- 로컬 응답에서 `/about`, `/career`, `/work` canonical이 `/`를 가리키고 작업물 상세는 자체 canonical과 `CreativeWork` JSON-LD를 갖는 것을 확인했습니다.
- `/sitemap.xml`, `/robots.txt`, `/favicon.svg`, `/favicon.ico`가 모두 HTTP 200과 올바른 content type으로 응답하는 것을 확인했습니다.

### 남은 주의점
- 배포 후 Google Search Console 또는 다른 검색 도구에 `https://dolbakggom.com/sitemap.xml`을 한 번 제출하면 신규 작업물 발견이 더 안정적입니다.

## 2026-07-14 Public Keyboard And Screen Reader Accessibility

### 요구사항
- 사이트 전반 감사의 다음 단계로 공개 화면의 키보드 탐색과 스크린 리더 문맥을 개선합니다.
- 기존 Figma 기반 시각 디자인과 홈 스크롤 연출은 유지합니다.

### 구현
- `src/layouts/PublicLayout.astro`, `src/styles/global.css`
  - 공개 페이지 첫 포커스에만 표시되는 `본문으로 건너뛰기` 링크를 추가했습니다.
  - 홈은 Intro를 건너뛰어 About으로, 작업물 상세는 본문으로 바로 이동합니다.
- `src/components/HomePage.astro`
  - 대표 작업물의 이미지, 제목, 메타, CTA 전체를 하나의 링크로 구성해 썸네일을 포함한 카드 전체를 클릭하거나 키보드로 열 수 있게 했습니다.
  - 비활성 대표 작업물은 초기 서버 HTML부터 `aria-hidden="true"`와 `tabindex="-1"`를 사용해 보이지 않는 링크가 먼저 포커스되는 문제를 막았습니다.
  - WORK 카테고리 tablist에 roving tabindex와 ArrowLeft/ArrowRight/Home/End 이동을 추가했습니다.
  - 필터 변경 후 선택 카테고리와 표시 작업물 개수를 `aria-live`로 안내합니다.
- `src/lib/keyboard-navigation.ts`, `tests/keyboard-navigation.test.ts`
  - 순환형 수평 탭 키보드 이동 계산을 공용 함수로 분리하고 경계/무관 키 회귀 테스트를 추가했습니다.
- `src/pages/work/[slug].astro`, `src/components/WorkBlocks.astro`
  - 작업물 뒤로가기 버튼의 접근성 이름을 한국어로 변경하고, 빈 이미지 placeholder가 불필요하게 읽히지 않도록 숨겼습니다.

### 검증
- 키보드 이동 테스트를 구현 전에 실행해 모듈 부재로 실패하는 것을 확인한 뒤 구현 후 3 tests passed를 확인했습니다.
- `npm run build`: `astro check` 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- 로컬 캐시 우회 HTML에서 skip link, 대표 작업물의 초기 `aria-hidden`/`tabindex`, 갤러리 탭의 roving tabindex, 결과 live region 출력을 확인했습니다.

### 남은 주의점
- Codex 인앱 브라우저가 런타임 초기화 충돌로 연결되지 않아 실제 Tab 키 입력 자동화는 수행하지 못했습니다. 키 이동 계산은 단위 테스트로 검증했고, 배포 전 수동 키보드 확인을 한 번 더 권장합니다.

## 2026-07-14 Public Error And Empty State Resilience

### 요구사항
- 사이트 전반 감사의 다음 단계로 존재하지 않는 페이지, 삭제된 작업물, 빈 작업물 목록, 공개 이미지 로딩 실패를 안정적으로 처리합니다.

### 원인
- D1 조회가 정상적으로 완료됐지만 slug가 없는 경우에도 같은 slug의 starter fallback 작업물이 있으면 다시 노출될 수 있었습니다.
- 일반 미존재 경로는 브랜드 레이아웃이 아닌 기본 404에 의존했습니다.
- 이미지 URL이 존재하지만 네트워크/R2 문제로 실패하면 브라우저의 깨진 이미지 표시가 그대로 노출됐습니다.
- 대표/갤러리 작업물이 0개일 때 Featured 구간이 빈 높이를 차지하거나 설명 없는 빈 grid가 표시될 수 있었습니다.

### 구현
- `src/lib/public-resilience.ts`, `src/lib/content.ts`, `tests/public-resilience.test.ts`
  - 정상적인 D1 조회 결과가 `없음`이면 반드시 404를 반환하고, D1 자체가 unavailable인 경우에만 starter work fallback을 사용하도록 정책을 분리했습니다.
  - 완료된 이미지의 intrinsic width가 0인 실패 상태 판정 로직을 공용화했습니다.
- `src/components/NotFoundPage.astro`, `src/pages/404.astro`, `src/pages/work/[slug].astro`
  - 일반 404와 작업물 404가 동일한 브랜드 타이포, 안내 문구, 처음/작업물 이동 액션을 사용하도록 구성했습니다.
  - 두 응답 모두 HTTP 404와 `noindex, nofollow`를 유지합니다.
- `src/layouts/PublicLayout.astro`, `src/components/HomePage.astro`, `src/components/WorkBlocks.astro`, `src/styles/global.css`
  - 공개 이미지에 공통 실패 감지를 연결하고 깨진 이미지 대신 영역별 placeholder를 표시합니다.
  - 이미지 대체텍스트가 있으면 실패 상태도 스크린 리더에 안내합니다.
  - 공개 작업물이 없으면 빈 갤러리 안내를 표시하고 빈 Featured scroll 구간은 제거합니다.

### 검증
- fallback 정책과 이미지 실패 판정 테스트를 구현 전 실패 확인 후 구현했으며 3 tests passed를 확인했습니다.
- `npm run build`: `astro check` 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- 로컬 `/missing-page`, `/work/missing-work`가 HTTP 404, HTML 응답, `noindex, nofollow`, 공용 이동 액션을 반환하는 것을 확인했습니다.
- Chrome 1440×1000과 390×844에서 404 화면을 확인했고, 최초 모바일 캡처에서 발견한 설명문 가로 잘림을 수정한 뒤 재캡처로 정상 줄바꿈을 확인했습니다.

### 남은 주의점
- 공개 이미지 실패 placeholder는 네트워크/R2 장애 시에만 보이며 원본 asset을 복구하지는 않습니다. 반복적으로 같은 asset이 실패하면 R2 객체 또는 저장된 key를 확인해야 합니다.

## 2026-07-14 Admin Authentication And Upload Security

### 요구사항
- 사이트 감사의 다음 단계로 관리자 인증, admin API 요청, 이미지 업로드 검증과 오류 응답을 보강합니다.

### 원인
- 로그인 시도 횟수 제한이 없어 비밀번호 대입 공격을 Worker가 계속 처리할 수 있었습니다.
- admin 상태 변경 요청은 세션 쿠키만 확인하고 `Origin`을 검증하지 않았습니다.
- 업로드 API가 브라우저가 보낸 MIME을 신뢰해 실제 파일 내용이 다른 위장 업로드를 구분하지 못했습니다.
- R2 저장 후 D1 asset metadata 생성이 실패하면 사용되지 않는 R2 객체가 남을 수 있었습니다.
- JSON 요청과 로그인 필드에 명시적인 자원 사용 상한이 없었습니다.

### 구현
- `wrangler.toml`, `src/env.d.ts`, `src/pages/api/admin/login.ts`
  - Workers Rate Limiting binding `ADMIN_LOGIN_RATE_LIMITER`를 추가해 관리자 로그인 처리를 Cloudflare location별 분당 10회로 제한했습니다.
  - 제한 시 `429`, `Retry-After: 60`, 한국어 안내를 반환합니다.
- `src/lib/request-security.ts`, `src/middleware.ts`, `src/lib/auth.ts`
  - admin 상태 변경 API는 요청 URL과 정확히 일치하는 `Origin`만 허용합니다.
  - 세션 쿠키를 `SameSite=Strict`로 강화하고 `SESSION_SECRET`이 최소 32바이트 미만이면 세션 서명을 거부합니다.
- `src/lib/http.ts`, `src/lib/validation.ts`
  - admin JSON 응답에 `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`를 기본 적용했습니다.
  - JSON 본문은 최대 2MB로 제한하고 로그인 필드 길이와 profile link 프로토콜을 검증해 `javascript:`/`data:` URL을 차단합니다.
- `src/lib/image-upload.ts`, `src/pages/api/admin/assets.ts`
  - JPEG, PNG, WebP, GIF magic bytes로 실제 파일 형식을 판별하고 선언 MIME과 다르면 업로드를 거부합니다.
  - D1 asset record 생성 실패 시 방금 저장한 R2 객체를 삭제합니다.
- `src/components/admin/AdminApp.tsx`
  - 로그인 요청 중 입력과 버튼을 잠가 중복 제출로 rate limit을 불필요하게 소모하지 않게 했습니다.
- `README.md`, `.dev.vars.example`, `AGENTS.md`
  - 신규 비밀번호는 salt가 포함된 PBKDF2 310,000회 방식으로 생성하도록 안내하고 새 binding/세션키 규칙을 기록했습니다.

### 검증
- 동일 출처, JSON 크기, 이미지 시그니처, URL scheme, 로그인 길이, 세션키 정책 테스트를 구현 전 실패 확인 후 통과시켰습니다.
- `npm run build`: `astro check` 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- 로컬 API에서 교차 출처 로그인은 `403`, 동일 출처의 잘못된 로그인은 `401`, 분당 한도 초과는 `429`와 `Retry-After: 60`을 반환했습니다.
- API 오류 응답에 `Cache-Control: no-store`와 `X-Content-Type-Options: nosniff`가 포함되는 것을 확인했습니다.

### 남은 주의점
- Rate Limiting binding은 Cloudflare location별 permissive counter입니다. 단일 관리자 로그인 보호에는 적합하지만 전역의 정확한 회계용 제한은 아닙니다.
- 기존 배포의 `sha256:` 비밀번호 해시는 로그인 중단 방지를 위해 계속 지원합니다. 보안 강도를 높이려면 README 명령으로 PBKDF2 해시를 만든 뒤 Cloudflare `ADMIN_PASSWORD_HASH` secret을 교체해야 합니다.

## 2026-07-14 Rich Text Sanitization And Work Block Integrity

### 요구사항
- 사이트 감사의 다음 단계로 관리자 리치 텍스트와 작업물 블록의 저장/출력 경계를 강화합니다.
- 기존 작업물 내용은 가능한 한 보존하면서 실행 가능한 HTML이나 비정상적인 블록 옵션이 공개 페이지에 전달되지 않게 합니다.

### 원인
- 프로필 소개와 작업물 문단/인용은 데이터베이스 문자열을 `set:html`로 출력했지만 서버 측 HTML allowlist 정제가 없었습니다.
- 작업물 블록 `content`가 임의의 JSON object를 허용해 타입과 관계없는 필드, 임의 CSS 값, 외부 또는 실행 가능한 이미지 URL도 저장할 수 있었습니다.
- 기존 D1 레코드가 현재 에디터 규칙과 다를 때 안전하게 복구하는 조회 정책이 없었습니다.

### 구현
- `src/lib/content-sanitizer.ts`, `sanitize-html`
  - 프로필 소개는 `p`, `br`, `em`, `strong`만 허용합니다.
  - 작업물 본문은 Tiptap 텍스트 구조에 필요한 문단, 강조, 목록, 인용, 코드 태그만 허용하고 모든 속성, script/style, embedded media를 제거합니다.
- `src/lib/work-block-content.ts`, `src/lib/validation.ts`
  - heading, paragraph, quote, image, gallery별 Zod content schema를 추가했습니다.
  - 행간, 문단 간격, 폭, 정렬 값을 에디터 선택지로 제한하고 block은 100개, gallery 이미지는 24개로 제한했습니다.
  - 본문 이미지는 같은 사이트의 `/media/` 경로만 허용하며 `javascript:`, `data:`, 외부 origin, 경로 이탈을 거부합니다.
  - API 저장 전 HTML을 정제하고 타입과 관계없는 JSON 필드를 제거합니다.
- `src/lib/content.ts`, `src/lib/admin-data.ts`, `src/components/HomePage.astro`, `src/components/WorkBlocks.astro`
  - public/admin 조회 시 기존 레코드도 정규화하고 실제 HTML 출력 지점에서 한 번 더 정제합니다.
  - 기존 블록의 일부 옵션이 잘못된 경우 본문 전체를 버리지 않고 안전한 텍스트는 보존하며 해당 옵션만 기본값으로 복구합니다.
- `tests/content-sanitizer.test.ts`, `tests/work-block-content.test.ts`
  - XSS markup 제거, Tiptap 태그 보존, 외부 미디어 차단, unknown field 제거, collection limit, legacy data 복구 회귀 테스트를 추가했습니다.

### 검증
- 신규 테스트를 구현 전에 실행해 모듈 부재 및 legacy 복구 기대값 불일치를 확인한 뒤 구현했습니다.
- `node --test tests/*.test.ts`: 37 tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- `git diff --check`: 통과.

### 남은 주의점
- 기존 D1 행은 조회 시 안전하게 정규화되지만 데이터베이스 자체가 즉시 다시 작성되지는 않습니다. 관리자가 해당 작업물을 다음에 저장하면 정제된 canonical content가 저장됩니다.
- 작업물 본문 이미지는 R2 media route 사용을 전제로 하므로 외부 이미지 URL을 직접 입력하는 방식은 지원하지 않습니다.

## 2026-07-14 Dependency Security Patch And Dev Watch Stability

### 요구사항
- 사이트 감사 후속 작업으로 npm이 보고한 의존성 보안 항목의 실제 경로와 영향 범위를 확인하고 호환성을 유지하며 패치합니다.
- iCloud용 `node_modules.nosync` 구조를 유지하면서 의존성 업데이트 후 개발 서버가 안정적으로 동작하게 합니다.

### 원인
- `astro 6.2.1`이 공개된 XSS/SSRF 수정 버전보다 낮았고 `wrangler 4.87.0`도 Miniflare, undici, ws 보안 수정선보다 낮았습니다.
- `@astrojs/cloudflare 13.3.0`이 오래된 Cloudflare Vite plugin과 별도 Wrangler를 중첩 설치해 루트 Wrangler만 올려도 고위험 advisory가 남았습니다.
- `node_modules`가 `node_modules.nosync`를 가리키는 symlink라 Vite watcher가 실제 target 내부의 설치 변경을 소스 변경으로 감지해 반복 reload와 stale optimized dependency 오류를 일으켰습니다.

### 구현
- `package.json`, `package-lock.json`
  - Astro를 `6.4.8`, Cloudflare adapter를 `13.7.0`, 루트 Wrangler를 `4.105.0`으로 업데이트했습니다.
  - Wrangler는 기존 `@cloudflare/workers-types 4` 계열과 호환되는 보안 수정 버전으로 고정해 불필요한 types 5 메이저 전환을 피했습니다.
  - 비강제 `npm audit fix`로 Vite, Babel, YAML language server, fast-uri 등 호환 가능한 하위 보안 패치를 적용했습니다.
- `astro.config.mjs`
  - Vite watcher에서 `**/node_modules.nosync/**`를 제외해 의존성 변경이 애플리케이션 소스 reload로 처리되지 않게 했습니다.
  - `node_modules -> node_modules.nosync` symlink 구조는 그대로 유지했습니다.

### 검증
- 최초 `npm audit`: 16 vulnerabilities (2 low, 5 moderate, 9 high).
- 업데이트 후 `npm audit`: 3 low, 0 moderate, 0 high, 0 critical.
- `node --test tests/*.test.ts`: 37 tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- 실제 physical dependency tree에서 Astro `6.4.8`, Cloudflare adapter `13.7.0`, root Wrangler `4.105.0`과 안전한 중첩 Vite/Wrangler 버전을 확인했습니다.
- 새 dev server에서 `/`, `/about`, `/career`, `/work`, `/admin`이 HTTP 200으로 응답하고 watcher 오류가 다시 발생하지 않는 것을 확인했습니다.

### 남은 주의점
- 남은 low 3건은 Astro 6의 esbuild가 Windows 개발 서버에서 로컬 파일 읽기를 허용할 수 있다는 advisory입니다. 현재 macOS 개발 및 Cloudflare 배포 런타임에는 해당하지 않습니다.
- 이를 audit 0으로 만들려면 Astro 7, Cloudflare adapter 14 등 메이저 업그레이드가 필요합니다. 기능 회귀 위험에 비해 현재 이득이 작아 `npm audit fix --force`는 실행하지 않았습니다.

## 2026-07-14 Maintenance, Observability, Integration Tests, And File Structure

### 요구사항
- 초기 사이트 감사에서 남은 대형 파일, 부족한 핵심 흐름 테스트, Git 내부 D1/R2 백업, 조용한 D1 fallback 문제를 모두 개선합니다.
- 기존 공개 페이지 복원력과 10분 HTML cache 정책은 유지합니다.

### 구현
- 저장소와 iCloud 구조
  - Git이 추적하던 D1/R2 snapshot을 프로젝트 상위 `../backups/d1`, `../backups/r2`로 이전했습니다.
  - 중복된 두 R2 snapshot은 byte 단위 동일함을 확인한 뒤 최신 한 벌만 보관했습니다.
  - `d1-backups/`, `r2-backups/`, iCloud가 만드는 `node_modules 2` 형태를 ignore하고 `node_modules -> node_modules.nosync` 링크를 복구했습니다.
- D1 관측성
  - `src/lib/content-observability.ts`를 추가해 홈/작업물 D1 조회 실패를 `portfolio.content.read_failed` 구조화 이벤트로 기록합니다.
  - fallback starter content 동작은 유지하며 로그에는 scope, optional slug, 정규화된 오류명/메시지만 포함합니다.
  - `wrangler.toml`에서 Workers Logs를 100% 보존하고 invocation log는 비활성화했습니다.
  - 이미지 업로드 내부 오류도 `portfolio.asset.upload_failed`로 기록합니다.
- 통합 테스트
  - Wrangler `createTestHarness`와 테스트 전용 D1 migration Worker를 사용해 빌드된 Astro Worker를 임시 D1/R2/KV에서 실행합니다.
  - 관리자 로그인, 작업물 생성·수정 후 D1 block 공개 렌더링과 cache purge, 이미지 R2 업로드·D1 metadata·media 응답을 검증합니다.
  - `playwright-core`와 설치된 Chrome의 390x844 viewport로 `/about`, `/career`, wheel scroll, timeline 활성 상태, 가로 overflow를 검증합니다.
  - 이 테스트에서 `/about` 초기 진행률 24%가 career 판정 구간에 들어가던 회귀를 발견해 about 유지 구간 5%로 수정했습니다.
- 파일 구조
  - `HomePage.astro`의 모션 코드를 `src/scripts/home-page.ts`로 이동해 1,426줄에서 308줄로 줄였습니다.
  - `AdminApp.tsx`의 icon, 공용 타입/유틸, 이미지 전처리, live preview를 `AdminSupport.tsx`로 분리해 1,547줄에서 1,111줄로 줄였습니다.
  - `global.css`를 공통 기반, home identity, home work/gallery, work detail, responsive 파일로 분리해 각 파일을 240~603줄 범위로 줄였습니다.
  - `npm run test:unit`, `npm run test:integration`, `npm test` script와 README 실행법을 추가했습니다.

### 중요 파일
- `.gitignore`, `README.md`, `wrangler.toml`, `package.json`, `package-lock.json`
- `src/lib/content-observability.ts`, `src/lib/content.ts`, `src/pages/api/admin/assets.ts`
- `tests/content-observability.test.ts`, `tests/integration/worker.integration.ts`, `tests/fixtures/`
- `src/components/HomePage.astro`, `src/scripts/home-page.ts`
- `src/components/admin/AdminApp.tsx`, `src/components/admin/AdminSupport.tsx`
- `src/styles/global.css`, `src/styles/home-identity.css`, `src/styles/home-work.css`, `src/styles/work-detail.css`, `src/styles/responsive.css`

### 검증
- `node --test tests/*.test.ts`: 55 tests passed.
- `npm run test:integration`: 4 integration tests passed.
- `npm run build`: Astro check 0 errors / 0 warnings / 0 hints, Cloudflare server build complete.
- `git diff --check`: 통과.

### 남은 주의점
- `AdminApp.tsx`는 크게 줄었지만 상태와 저장 orchestration이 1,111줄에 남아 있습니다. 다음 관리자 기능 추가 전에 Profile/Timeline/Works 화면 컴포넌트와 controller hook을 추가 분리하는 것이 좋습니다.
- `.git`에는 과거 commit의 압축된 백업 object가 남아 있습니다. 이번 변경을 commit한 뒤 일반 `git gc`로 일부 회수할 수 있지만, 과거 history에서 완전히 제거하려면 파괴적인 history rewrite가 필요하므로 수행하지 않았습니다.
- 통합 테스트는 macOS의 `/Applications/Google Chrome.app`을 사용합니다. Chrome이 없는 CI에서는 실행 경로를 환경변수로 바꾸거나 Playwright browser provisioning이 필요합니다.
