CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  alt TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  headline TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  intro TEXT NOT NULL,
  bio TEXT NOT NULL,
  portrait_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  links TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timeline_items (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS works (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('UI/UX', 'BI/BX')),
  summary TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  thumbnail_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  hero_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_blocks (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'image', 'gallery', 'quote')),
  content TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_order ON timeline_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_works_order ON works(sort_order);
CREATE INDEX IF NOT EXISTS idx_works_slug ON works(slug);
CREATE INDEX IF NOT EXISTS idx_work_blocks_work_order ON work_blocks(work_id, sort_order);

INSERT OR IGNORE INTO profile (
  id,
  headline,
  name,
  role,
  intro,
  bio,
  links
) VALUES (
  'main',
  'Beyond the Answer.',
  'Portfolio Owner',
  'UI/UX · BI/BX Designer',
  '질문 너머의 맥락을 설계하고, 브랜드와 사용자가 만나는 순간을 명확하게 만듭니다.',
  '디지털 제품과 브랜드 경험을 함께 다루는 디자이너입니다. 리서치, 구조화, 인터페이스, 시각 언어를 연결해 오래 쓰이는 경험을 만드는 일을 좋아합니다.',
  '[{"label":"Email","url":"mailto:hello@example.com"},{"label":"Behance","url":"https://www.behance.net/"}]'
);

INSERT OR IGNORE INTO timeline_items (id, period, title, organization, description, sort_order) VALUES
  ('timeline-01', '2026', 'Portfolio System Launch', 'Independent', '작업물과 커리어를 직접 관리할 수 있는 포트폴리오 시스템을 구축했습니다.', 1),
  ('timeline-02', '2024 - 2025', 'Digital Product Design', 'Selected Projects', '서비스 구조, 정보 설계, UI 시스템, 프로토타입까지 이어지는 제품 디자인을 진행했습니다.', 2),
  ('timeline-03', '2022 - 2023', 'Brand Experience Design', 'Selected Projects', '브랜드 전략을 웹과 캠페인, 그래픽 언어로 확장하는 프로젝트를 수행했습니다.', 3);

INSERT OR IGNORE INTO works (
  id,
  slug,
  title,
  category,
  summary,
  client,
  year,
  role,
  featured,
  published,
  sort_order
) VALUES
  ('work-01', 'answer-system', 'Answer System', 'UI/UX', '질문과 답변 사이의 맥락을 재구성한 AI 서비스 경험 설계.', 'Self Initiated', '2026', 'UX Strategy, UI Design', 1, 1, 1),
  ('work-02', 'orbit-brand', 'Orbit Brand', 'BI/BX', '유연한 궤도와 선명한 기준을 가진 브랜드 아이덴티티 시스템.', 'Concept', '2025', 'Brand Identity', 1, 1, 2),
  ('work-03', 'daily-commerce', 'Daily Commerce', 'UI/UX', '반복 구매 여정을 짧고 명확하게 만든 커머스 앱 리디자인.', 'Selected Client', '2025', 'Product Design', 1, 1, 3),
  ('work-04', 'north-archive', 'North Archive', 'BI/BX', '아카이브형 브랜드의 콘텐츠 구조와 시각 시스템 설계.', 'Selected Client', '2024', 'BX Design', 1, 1, 4),
  ('work-05', 'field-dashboard', 'Field Dashboard', 'UI/UX', '운영 데이터를 빠르게 스캔하고 조치하는 업무형 대시보드.', 'Selected Client', '2024', 'UX/UI', 1, 1, 5),
  ('work-06', 'studio-index', 'Studio Index', 'BI/BX', '스튜디오의 작업 방식을 색, 그리드, 모션 원칙으로 정리한 아이덴티티.', 'Concept', '2023', 'Identity System', 0, 1, 6);

INSERT OR IGNORE INTO work_blocks (id, work_id, type, content, sort_order) VALUES
  ('block-01', 'work-01', 'heading', '{"text":"Project Overview"}', 1),
  ('block-02', 'work-01', 'paragraph', '{"html":"<p>Answer System은 사용자의 질문을 단순 입력값이 아니라 맥락과 의도로 바라보는 제품 경험 실험입니다.</p>"}', 2),
  ('block-03', 'work-01', 'quote', '{"html":"<blockquote>정답보다 중요한 것은, 사용자가 다음 질문으로 넘어갈 수 있게 만드는 구조입니다.</blockquote>"}', 3);
