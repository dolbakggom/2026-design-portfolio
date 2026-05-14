PRAGMA foreign_keys=off;

CREATE TABLE works_new (
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

INSERT INTO works_new (
  id,
  slug,
  title,
  category,
  summary,
  client,
  year,
  role,
  thumbnail_asset_id,
  hero_asset_id,
  featured,
  published,
  sort_order,
  created_at,
  updated_at,
  featured_thumbnail_asset_id
)
SELECT
  id,
  slug,
  title,
  category,
  summary,
  client,
  year,
  role,
  thumbnail_asset_id,
  hero_asset_id,
  featured,
  published,
  sort_order,
  created_at,
  updated_at,
  featured_thumbnail_asset_id
FROM works;

DROP TABLE works;
ALTER TABLE works_new RENAME TO works;

CREATE INDEX IF NOT EXISTS idx_works_order ON works(sort_order);
CREATE INDEX IF NOT EXISTS idx_works_slug ON works(slug);

PRAGMA foreign_keys=on;
