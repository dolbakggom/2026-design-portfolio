PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_initial.sql','2026-05-07 02:30:48');
INSERT INTO "d1_migrations" VALUES(2,'0002_figma_home_content.sql','2026-05-07 02:30:48');
INSERT INTO "d1_migrations" VALUES(3,'0003_featured_thumbnail.sql','2026-05-11 14:25:12');
INSERT INTO "d1_migrations" VALUES(4,'0004_allow_multi_work_category.sql','2026-05-14 09:40:33');
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
INSERT INTO "assets" VALUES('7ab65b7e-8a9f-4a33-a5f8-1c63417687bf','uploads/2026/05/7ab65b7e-8a9f-4a33-a5f8-1c63417687bf-.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,716190,'2026-05-11 13:02:41');
INSERT INTO "assets" VALUES('d7e4b362-3d71-4a0d-a000-cba279ec85df','uploads/2026/05/d7e4b362-3d71-4a0d-a000-cba279ec85df-.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,716190,'2026-05-11 13:04:03');
INSERT INTO "assets" VALUES('921c3ab2-5531-49ec-a54d-151977375444','uploads/2026/05/921c3ab2-5531-49ec-a54d-151977375444-untitled.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,2052550,'2026-05-11 13:04:44');
INSERT INTO "assets" VALUES('d101cdd0-8559-48e7-8e73-bc0447b15156','uploads/2026/05/d101cdd0-8559-48e7-8e73-bc0447b15156-.png','Rush Hour App UI 기획 및 디자인','image/png',NULL,NULL,702104,'2026-05-11 13:04:49');
INSERT INTO "assets" VALUES('1753bfef-a080-4536-bb62-699795714d59','uploads/2026/05/1753bfef-a080-4536-bb62-699795714d59-dsc_6393-a--sdr.jpg','Orbit Brand','image/jpeg',NULL,NULL,139120,'2026-05-13 12:20:22');
INSERT INTO "assets" VALUES('1914d095-8e08-4e26-8f13-f1aacd765583','uploads/2026/05/1914d095-8e08-4e26-8f13-f1aacd765583-img_0257-2-sdr.jpg','Orbit Brand','image/jpeg',NULL,NULL,4328462,'2026-05-13 12:20:38');
INSERT INTO "assets" VALUES('4a7f901d-788b-4131-bbd8-69b86dd07c1a','uploads/2026/05/4a7f901d-788b-4131-bbd8-69b86dd07c1a-ditto_concept_photo_-283-29-2-sdr.jpg','Orbit Brand','image/jpeg',NULL,NULL,1072083,'2026-05-13 12:21:39');
INSERT INTO "assets" VALUES('e05a0cdf-dfbc-4165-aeb4-ff5c0d1fcdd7','uploads/2026/05/e05a0cdf-dfbc-4165-aeb4-ff5c0d1fcdd7-ditto_concept_photo_-286-29-2-sdr.jpg','Orbit Brand','image/jpeg',NULL,NULL,977836,'2026-05-13 12:21:48');
INSERT INTO "assets" VALUES('94f6ba1c-01b1-4d6a-b86c-f0af2fc0ee88','uploads/2026/05/94f6ba1c-01b1-4d6a-b86c-f0af2fc0ee88-dsc_6393-a--sdr.jpg','','image/jpeg',NULL,NULL,139120,'2026-05-13 12:23:24');
INSERT INTO "assets" VALUES('0a58d56f-419a-46b6-925b-05b183283314','uploads/2026/05/0a58d56f-419a-46b6-925b-05b183283314-frame-25-sdr.png','New Project','image/png',NULL,NULL,8711557,'2026-05-14 08:19:47');
INSERT INTO "assets" VALUES('5557d25f-3935-4189-847a-07b47547a2a5','uploads/2026/05/5557d25f-3935-4189-847a-07b47547a2a5-frame-25-sdr.png','New Project','image/png',NULL,NULL,8711557,'2026-05-14 08:19:52');
INSERT INTO "assets" VALUES('77768182-ad6e-4fff-9410-e170e8ec5858','uploads/2026/05/77768182-ad6e-4fff-9410-e170e8ec5858-poster-sdr.png','GiGA Portal','image/png',NULL,NULL,2377888,'2026-05-14 08:29:51');
INSERT INTO "assets" VALUES('7fbda9c6-92d4-4033-90b4-e7d8db834e49','uploads/2026/05/7fbda9c6-92d4-4033-90b4-e7d8db834e49-poster-sdr.png','GiGA Portal','image/png',NULL,NULL,1392714,'2026-05-14 08:34:10');
INSERT INTO "assets" VALUES('338e1a56-a043-43ef-9d31-14d88d9f4c91','uploads/2026/05/338e1a56-a043-43ef-9d31-14d88d9f4c91-poster-sdr.png','GiGA Portal','image/png',NULL,NULL,1392714,'2026-05-14 08:34:21');
INSERT INTO "assets" VALUES('1fcd12e3-6d6a-4ed1-9c10-eb70ba11a1d4','uploads/2026/05/1fcd12e3-6d6a-4ed1-9c10-eb70ba11a1d4-poster-sdr.png','GiGA Portal','image/png',NULL,NULL,2377795,'2026-05-14 08:34:35');
INSERT INTO "assets" VALUES('e19cf7be-5591-456e-994b-f6809080897f','uploads/2026/05/e19cf7be-5591-456e-994b-f6809080897f-poster-sdr.png','','image/png',NULL,NULL,2377795,'2026-05-14 08:37:23');
INSERT INTO "assets" VALUES('a78914ee-3e1b-48f7-8f13-bc6b88b5ac14','uploads/2026/05/a78914ee-3e1b-48f7-8f13-bc6b88b5ac14-default-movie-sdr.png','','image/png',NULL,NULL,2899602,'2026-05-14 08:37:28');
INSERT INTO "assets" VALUES('4421e1a4-787e-447b-bfb2-90d5f2ee02d5','uploads/2026/05/4421e1a4-787e-447b-bfb2-90d5f2ee02d5-after-design-sdr.png','','image/png',NULL,NULL,2492020,'2026-05-14 08:37:41');
INSERT INTO "assets" VALUES('2f627c07-1d78-4352-912f-b04c61493583','uploads/2026/05/2f627c07-1d78-4352-912f-b04c61493583-landing-movie-sdr.png','','image/png',NULL,NULL,2568851,'2026-05-14 08:37:54');
INSERT INTO "assets" VALUES('eb055bd0-598f-4d9d-a437-5b76e7418b8e','uploads/2026/05/eb055bd0-598f-4d9d-a437-5b76e7418b8e-youtube-sdr.png','','image/png',NULL,NULL,1599787,'2026-05-14 08:38:09');
INSERT INTO "assets" VALUES('108e8037-d386-4f70-a486-392ae0fdacb9','uploads/2026/05/108e8037-d386-4f70-a486-392ae0fdacb9-frame-3-2-sdr.png','','image/png',NULL,NULL,870095,'2026-05-14 08:43:27');
INSERT INTO "assets" VALUES('c65b246b-34dc-4873-85a0-7d8eadc82cc1','uploads/2026/05/c65b246b-34dc-4873-85a0-7d8eadc82cc1-frame-3-3-sdr.png','','image/png',NULL,NULL,1274424,'2026-05-14 08:44:53');
INSERT INTO "assets" VALUES('aa05ade8-3b7b-4f35-b3ce-a500dcee2f0e','uploads/2026/05/aa05ade8-3b7b-4f35-b3ce-a500dcee2f0e-frame-3-4-sdr.png','','image/png',NULL,NULL,823794,'2026-05-14 08:44:55');
INSERT INTO "assets" VALUES('78abf9af-2a04-4d5f-8266-e990695db3fa','uploads/2026/05/78abf9af-2a04-4d5f-8266-e990695db3fa-frame-3-5-sdr.png','','image/png',NULL,NULL,1557448,'2026-05-14 08:44:59');
INSERT INTO "assets" VALUES('1ab795ee-1167-41ee-aa87-d73fd5af96b8','uploads/2026/05/1ab795ee-1167-41ee-aa87-d73fd5af96b8-frame-3-6-sdr.png','','image/png',NULL,NULL,1035233,'2026-05-14 08:45:03');
INSERT INTO "assets" VALUES('2d4f3f24-a67a-4c47-9af3-01b9a7b2ab0e','uploads/2026/05/2d4f3f24-a67a-4c47-9af3-01b9a7b2ab0e-after-design-sdr.png','','image/png',NULL,NULL,2492020,'2026-05-14 08:45:23');
INSERT INTO "assets" VALUES('883c2ffb-dee9-4a5c-860c-2f5e3fa130e1','uploads/2026/05/883c2ffb-dee9-4a5c-860c-2f5e3fa130e1-landing-movie-sdr.png','','image/png',NULL,NULL,2568851,'2026-05-14 08:45:36');
INSERT INTO "assets" VALUES('8547901b-6102-4111-a14e-5da2f9edfebd','uploads/2026/05/8547901b-6102-4111-a14e-5da2f9edfebd-default-movie-sdr.png','','image/png',NULL,NULL,2899602,'2026-05-14 08:45:51');
INSERT INTO "assets" VALUES('46d44ec4-cd8d-4d30-9aba-2a1b66a2c190','uploads/2026/05/46d44ec4-cd8d-4d30-9aba-2a1b66a2c190-youtube-sdr.png','','image/png',NULL,NULL,1599787,'2026-05-14 08:45:57');
INSERT INTO "assets" VALUES('35a1acf4-035f-421c-9513-d9427197e099','uploads/2026/05/35a1acf4-035f-421c-9513-d9427197e099-poster-sdr.png','GiGA Portal','image/png',NULL,NULL,1604298,'2026-05-14 08:50:46');
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
INSERT INTO "profile" VALUES('main','Beyond the Answer.','Sihyeon Ham, 함시현','UI/UX 디자이너, 기획자','<p>안녕하세요,</p><p><em>UIUX 디자이너, 기획자 </em><strong>함시현</strong><em>입니다.</em></p><p>주어진 답에 머물지 않고, 더 나은 방향을 계속해서 설계합니다.</p>','초등학교 방과 후 교실에서 포토샵에 흥미를 가진 이후, 2014년부터 계속 활동하고 있습니다.',NULL,'[{"label":"hampenta@icloud.com","url":"mailto:hampenta@icloud.com"},{"label":"010 2672 1912","url":"tel:010-2672-1912"},{"label":"서울특별시, 강서구","url":"#profile"}]','2026-05-14 10:10:36');
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
INSERT INTO "timeline_items" VALUES('timeline-figma-01','2001.02','서울 양천구 출생','','',1,'2026-05-07 02:30:48','2026-05-14 01:55:27');
INSERT INTO "timeline_items" VALUES('timeline-figma-02','2016.10','디자인 활동 확장','','',2,'2026-05-07 02:30:48','2026-05-07 02:30:48');
INSERT INTO "timeline_items" VALUES('timeline-figma-03','2017.04','12회 AppJam 장려상 수상','SK플래닛, SK텔레콤 및 중소벤쳐기업부 주최 해커톤','test',3,'2026-05-07 02:30:48','2026-05-14 08:13:21');
INSERT INTO "timeline_items" VALUES('timeline-figma-04','2018.09','프로젝트 경험 확장','','',4,'2026-05-07 02:30:48','2026-05-07 02:30:48');
INSERT INTO "timeline_items" VALUES('timeline-figma-05','2020.03 ~ 2020.09','실무형 프로젝트 참여','','',5,'2026-05-07 02:30:48','2026-05-14 01:55:16');
CREATE TABLE work_blocks (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'image', 'gallery', 'quote')),
  content TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "work_blocks" VALUES('eb598a83-6f1e-4083-a269-1eb8d5da63db','work-01','heading','{"text":"New heading","lineHeight":"1.3","blockWidth":"880px","align":"left"}',1,'2026-05-22 05:58:23','2026-05-22 05:58:23');
INSERT INTO "work_blocks" VALUES('31f5de00-6792-499e-8711-a2d033cb0bf9','work-01','paragraph','{"html":"<p>New paragraph</p>","lineHeight":"1.7","paragraphGap":"18px","blockWidth":"880px","align":"left"}',2,'2026-05-22 05:58:23','2026-05-22 05:58:23');
INSERT INTO "work_blocks" VALUES('4490ed9d-ee49-473e-a3fb-af179cde53ed','work-01','image','{"url":"","alt":"","caption":""}',3,'2026-05-22 05:58:23','2026-05-22 05:58:23');
INSERT INTO "work_blocks" VALUES('89effa99-3849-4030-8af6-5ca485c832c9','work-01','heading','{"text":"New heading","lineHeight":"1.3","blockWidth":"880px","align":"left"}',4,'2026-05-22 05:58:23','2026-05-22 05:58:23');
INSERT INTO "work_blocks" VALUES('dc8dd60e-33b7-488a-8713-e0241ebdecbc','work-01','paragraph','{"html":"<p>New paragraph</p>","lineHeight":"1.7","paragraphGap":"18px","blockWidth":"880px","align":"left"}',5,'2026-05-22 05:58:23','2026-05-22 05:58:23');
INSERT INTO "work_blocks" VALUES('ba943922-727a-4d61-ab49-be7e5852387a','work-01','image','{"url":"","alt":"","caption":""}',6,'2026-05-22 05:58:23','2026-05-22 05:58:23');
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
INSERT INTO "works" VALUES('work-01','rush-hour-app','Rush Hour App UI 기획 및 디자인','UI/UX','출퇴근 시간대 이동 경험을 더 빠르게 판단할 수 있도록 설계한 앱 UI 프로젝트.','개인 프로젝트','2023','Figma + Adobe Illustrator','d101cdd0-8559-48e7-8e73-bc0447b15156',NULL,1,1,1,'2026-05-07 02:30:48','2026-05-22 05:58:23',NULL);
INSERT INTO "works" VALUES('work-02','orbit-brand','Orbit Brand','BI/BX','유연한 궤도와 선명한 기준을 가진 브랜드 아이덴티티 시스템.','Concept','2025','Brand Identity','4a7f901d-788b-4131-bbd8-69b86dd07c1a',NULL,1,1,2,'2026-05-07 02:30:48','2026-05-22 05:57:50','e05a0cdf-dfbc-4165-aeb4-ff5c0d1fcdd7');
INSERT INTO "works" VALUES('work-03','daily-commerce','Daily Commerce','UI/UX','반복 구매 여정을 짧고 명확하게 만든 커머스 앱 리디자인.','Selected Client','2025','Product Design',NULL,NULL,0,1,3,'2026-05-07 02:30:48','2026-05-22 05:57:50',NULL);
INSERT INTO "works" VALUES('work-04','north-archive','North Archive','BI/BX','아카이브형 브랜드의 콘텐츠 구조와 시각 시스템 설계.','Selected Client','2024','BX Design',NULL,NULL,0,1,4,'2026-05-07 02:30:48','2026-05-22 05:57:50',NULL);
INSERT INTO "works" VALUES('work-05','field-dashboard','Field Dashboard','UI/UX','운영 데이터를 빠르게 스캔하고 조치하는 업무형 대시보드.','Selected Client','2024','UX/UI',NULL,NULL,0,1,5,'2026-05-07 02:30:48','2026-05-22 05:57:50',NULL);
INSERT INTO "works" VALUES('work-06','studio-index','Studio Index','BI/BX','스튜디오의 작업 방식을 색, 그리드, 모션 원칙으로 정리한 아이덴티티.','Concept','2023','Identity System',NULL,NULL,0,1,6,'2026-05-07 02:30:48','2026-05-22 05:57:50',NULL);
INSERT INTO "works" VALUES('01d56af4-cf2b-4cc2-8743-54bba71c371d','ktgigaportal','기가지니 OTT 플랫폼','UI/UX, BI/BX',replace('2021년, 군 복무를 하며 만든 토이 프로젝트입니다.\n\n군 내 기가지니 셋톱박스의 경우 유튜브 및 기타 OTT 서비스를 사용할 수 없도록 제한 조치가 걸려있으나\n일부 앱의 취약점을 이용하여 해당 웹 앱으로 이동하여 사용할 수 있도록 처리하였으며, TV의 경우 모델마다\n올바르게 표현되지 못하는 부분이 있어 KT의 기가지니 앱 개발 가이드를 참고하여 개발하였습니다.\n\nYouTube 영상을 받아오기 위해 일부 오픈소스를 사용하였으며 비디오의 경우 원활한 트래픽 처리를 위해\nAWS를 이용하였습니다.\n\n해당 프로젝트의 경우 공개가 어려운 프로젝트로, 목업 이미지를 확인해 주시길 부탁드립니다.','\n',char(10)),'','2021','UI/UX Design, Full-stack Development','35a1acf4-035f-421c-9513-d9427197e099',NULL,1,1,7,'2026-05-14 08:18:07','2026-05-22 05:57:50','1fcd12e3-6d6a-4ed1-9c10-eb70ba11a1d4');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',4);
CREATE INDEX idx_timeline_order ON timeline_items(sort_order);
CREATE INDEX idx_work_blocks_work_order ON work_blocks(work_id, sort_order);
CREATE INDEX idx_works_order ON works(sort_order);
CREATE INDEX idx_works_slug ON works(slug);