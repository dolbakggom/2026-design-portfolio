ALTER TABLE works ADD COLUMN featured_thumbnail_asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL;
