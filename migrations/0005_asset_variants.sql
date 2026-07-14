CREATE TABLE IF NOT EXISTS asset_variants (
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  r2_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0 CHECK (size >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (asset_id, width)
);

CREATE INDEX IF NOT EXISTS idx_asset_variants_asset_width
  ON asset_variants(asset_id, width);
