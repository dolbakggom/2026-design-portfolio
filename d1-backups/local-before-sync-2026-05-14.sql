PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_initial.sql','2026-05-11 13:21:41');
INSERT INTO "d1_migrations" VALUES(2,'0002_figma_home_content.sql','2026-05-11 13:21:41');
INSERT INTO "d1_migrations" VALUES(3,'0003_featured_thumbnail.sql','2026-05-11 13:21:41');
INSERT INTO "d1_migrations" VALUES(4,'0004_allow_multi_work_category.sql','2026-05-14 09:40:17');
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  r2_key TEXT NOT NULL UNIQUE,
  alt TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "assets" VALUES('750fa668-8e35-40c1-aa6a-9cbb61efd216','uploads/2026/05/750fa668-8e35-40c1-aa6a-9cbb61efd216-.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,702104,'2026-05-11 14:20:35');
INSERT INTO "assets" VALUES('12c5e1b2-1021-4863-821f-e9a93ffa546d','uploads/2026/05/12c5e1b2-1021-4863-821f-e9a93ffa546d-.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,716190,'2026-05-11 14:20:49');
INSERT INTO "assets" VALUES('00df4d6c-bb3c-4cda-bc79-c6cca589c151','uploads/2026/05/00df4d6c-bb3c-4cda-bc79-c6cca589c151-.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,716190,'2026-05-12 03:08:48');
INSERT INTO "assets" VALUES('56ee5809-4844-4c68-a5a0-9d0b509b60e7','uploads/2026/05/56ee5809-4844-4c68-a5a0-9d0b509b60e7-img_3342.jpeg','프로젝트 테스트','image/jpeg',NULL,NULL,4887028,'2026-05-12 09:16:09');
INSERT INTO "assets" VALUES('2d50038d-665b-438e-af78-545828f40d01','uploads/2026/05/2d50038d-665b-438e-af78-545828f40d01-img_3810.jpeg','프로젝트 테스트','image/jpeg',NULL,NULL,3210817,'2026-05-12 09:16:34');
INSERT INTO "assets" VALUES('d99e6bff-a6dc-4624-9cbd-83d145ebc207','uploads/2026/05/d99e6bff-a6dc-4624-9cbd-83d145ebc207-img_3784.jpeg','프로젝트 테스트','image/jpeg',NULL,NULL,6963412,'2026-05-12 09:17:42');
INSERT INTO "assets" VALUES('51a10ca1-b3ca-476b-927e-d2364b82fd57','uploads/2026/05/51a10ca1-b3ca-476b-927e-d2364b82fd57-img_3700.jpeg','프로젝트 테스트','image/jpeg',NULL,NULL,3780835,'2026-05-12 09:20:10');
INSERT INTO "assets" VALUES('1c8a7218-c756-4cc2-acef-9563f92d0f13','uploads/2026/05/1c8a7218-c756-4cc2-acef-9563f92d0f13-1770603590.44481img_8968.jpeg','','image/jpeg',NULL,NULL,705022,'2026-05-12 09:21:50');
INSERT INTO "assets" VALUES('84bdf1f3-e01d-4423-ab3f-46698310cced','uploads/2026/05/84bdf1f3-e01d-4423-ab3f-46698310cced-1770603590.4897509img_8969.jpeg','','image/jpeg',NULL,NULL,1032148,'2026-05-12 09:22:06');
CREATE TABLE profile (
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
INSERT INTO "profile" VALUES('main','Beyond the Answer.','Sihyeon Ham, 함시현','UIUX 디자이너, 기획자','<p>안녕하세요,</p><p><em>UIUX 디자이너, 기획자 </em><strong>함시현</strong><em>입니다.</em></p><p>주어진 답에 머물지 않고, 더 나은 방향을 계속해서 설계합니다.</p>','초등학교 방과 후 교실에서 포토샵에 흥미를 가진 이후, 2014년부터 계속 활동하고 있습니다.',NULL,'[{"label":"hampenta@icloud.com","url":"mailto:hampenta@icloud.com"},{"label":"010-2672-1912","url":"tel:010-2672-1912"},{"label":"서울특별시, 강서구","url":"#profile"}]','2026-05-14 07:59:12');
CREATE TABLE timeline_items (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "timeline_items" VALUES('timeline-figma-01','2001.02','디자인에 관심을 갖기 시작','','',1,'2026-05-11 13:21:41','2026-05-14 06:07:12');
INSERT INTO "timeline_items" VALUES('timeline-figma-02','2016.10','디자인 활동 확장','','',2,'2026-05-11 13:21:41','2026-05-11 13:21:41');
INSERT INTO "timeline_items" VALUES('timeline-figma-03','2017.04','12회 AppJam 장려상 수상','SK플래닛, SK텔레콤 및 중소벤쳐기업부 주최 해커톤','',3,'2026-05-11 13:21:41','2026-05-11 13:21:41');
INSERT INTO "timeline_items" VALUES('timeline-figma-04','2018.09','프로젝트 경험 확장','','',4,'2026-05-11 13:21:41','2026-05-11 13:21:41');
INSERT INTO "timeline_items" VALUES('timeline-figma-05','2020.03 ~ 2020.09','실무형 프로젝트 참여','','',5,'2026-05-11 13:21:41','2026-05-11 13:21:41');
CREATE TABLE work_blocks (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'image', 'gallery', 'quote')),
  content TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "work_blocks" VALUES('9527012e-8dca-4467-b6f8-856ac4854e3b','work-01','image','{"url":"","alt":"","caption":""}',1,'2026-05-14 10:01:35','2026-05-14 10:01:35');
INSERT INTO "work_blocks" VALUES('fa78722e-7b70-450f-820e-3e94794bb52a','work-01','paragraph','{"html":"<p>New paragraph</p>","lineHeight":"1.7","paragraphGap":"18px","blockWidth":"880px","align":"left"}',2,'2026-05-14 10:01:35','2026-05-14 10:01:35');
CREATE TABLE IF NOT EXISTS "works" (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('UI/UX', 'BI/BX', 'UI/UX, BI/BX')),
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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  featured_thumbnail_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL
);
INSERT INTO "works" VALUES('work-01','rush-hour-app','Rush Hour App UI 기획 및 디자인','UI/UX','출퇴근 시간대 이동 경험을 더 빠르게 판단할 수 있도록 설계한 앱 UI 프로젝트.','개인 프로젝트','2023','Figma + Adobe Illustrator','00df4d6c-bb3c-4cda-bc79-c6cca589c151',NULL,1,1,1,'2026-05-11 13:21:41','2026-05-14 10:01:35','750fa668-8e35-40c1-aa6a-9cbb61efd216');
INSERT INTO "works" VALUES('work-02','test1','프로젝트 테스트','BI/BX','유연한 궤도와 선명한 기준을 가진 브랜드 아이덴티티 시스템.','tset','2025','Brand Identity','56ee5809-4844-4c68-a5a0-9d0b509b60e7',NULL,1,1,2,'2026-05-11 13:21:41','2026-05-14 09:49:30','2d50038d-665b-438e-af78-545828f40d01');
INSERT INTO "works" VALUES('work-03','daily-commerce','Daily Commerce','UI/UX','반복 구매 여정을 짧고 명확하게 만든 커머스 앱 리디자인.','Selected Client','2025','Product Design',NULL,NULL,1,1,3,'2026-05-11 13:21:41','2026-05-14 09:49:30',NULL);
INSERT INTO "works" VALUES('work-04','north-archive','North Archive','BI/BX','아카이브형 브랜드의 콘텐츠 구조와 시각 시스템 설계.','Selected Client','2024','BX Design',NULL,NULL,1,1,4,'2026-05-11 13:21:41','2026-05-14 09:49:30',NULL);
INSERT INTO "works" VALUES('work-05','field-dashboard','Field Dashboard','UI/UX','운영 데이터를 빠르게 스캔하고 조치하는 업무형 대시보드.','Selected Client','2024','UX/UI',NULL,NULL,1,1,5,'2026-05-11 13:21:41','2026-05-14 09:49:30',NULL);
INSERT INTO "works" VALUES('work-06','studio-index','Studio Index','BI/BX','스튜디오의 작업 방식을 색, 그리드, 모션 원칙으로 정리한 아이덴티티.','Concept','2023','Identity System',NULL,NULL,0,1,6,'2026-05-11 13:21:41','2026-05-14 09:49:30',NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',4);
CREATE INDEX idx_timeline_order ON timeline_items(sort_order);
CREATE INDEX idx_work_blocks_work_order ON work_blocks(work_id, sort_order);
CREATE INDEX idx_works_order ON works(sort_order);
CREATE INDEX idx_works_slug ON works(slug);