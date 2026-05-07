UPDATE profile
SET
  headline = 'Beyond the Answer.',
  name = 'Sihyeon Ham, 함시현',
  role = 'UIUX 디자이너, 기획자',
  intro = '<p>안녕하세요,</p><p><em>UIUX 디자이너, 기획자 </em><strong>함시현</strong><em>입니다.</em></p><p>주어진 답에 머물지 않고, 더 나은 방향을 계속해서 설계합니다.</p>',
  bio = '초등학교 방과 후 교실에서 포토샵에 흥미를 가진 이후, 2014년부터 계속 활동하고 있습니다.',
  links = '[{"label":"hampenta@icloud.com","url":"mailto:hampenta@icloud.com"},{"label":"010-2672-1912","url":"tel:010-2672-1912"},{"label":"서울특별시, 강서구","url":"#profile"}]',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'main';

DELETE FROM timeline_items;

INSERT INTO timeline_items (id, period, title, organization, description, sort_order) VALUES
  ('timeline-figma-01', '2001.02', '디자인에 관심을 갖기 시작', '', '', 1),
  ('timeline-figma-02', '2016.10', '디자인 활동 확장', '', '', 2),
  ('timeline-figma-03', '2017.04', '12회 AppJam 장려상 수상', 'SK플래닛, SK텔레콤 및 중소벤쳐기업부 주최 해커톤', '', 3),
  ('timeline-figma-04', '2018.09', '프로젝트 경험 확장', '', '', 4),
  ('timeline-figma-05', '2020.03 ~ 2020.09', '실무형 프로젝트 참여', '', '', 5);

UPDATE works
SET
  slug = 'rush-hour-app',
  title = 'Rush Hour App UI 기획 및 디자인',
  category = 'UI/UX',
  summary = '출퇴근 시간대 이동 경험을 더 빠르게 판단할 수 있도록 설계한 앱 UI 프로젝트.',
  client = '개인 프로젝트',
  year = '2023',
  role = 'Figma + Adobe Illustrator',
  featured = 1,
  published = 1,
  sort_order = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'work-01';
