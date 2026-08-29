CREATE TABLE work_blocks_with_code (
  id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('heading', 'paragraph', 'code', 'image', 'gallery', 'quote', 'website', 'divider')),
  content TEXT NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO work_blocks_with_code (id, work_id, type, content, sort_order, created_at, updated_at)
SELECT id, work_id, type, content, sort_order, created_at, updated_at
FROM work_blocks;

DROP TABLE work_blocks;
ALTER TABLE work_blocks_with_code RENAME TO work_blocks;

CREATE INDEX idx_work_blocks_work_order ON work_blocks(work_id, sort_order);
