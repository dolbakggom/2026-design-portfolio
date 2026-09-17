CREATE TABLE analytics_views (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX analytics_views_last_seen ON analytics_views(last_seen);
CREATE INDEX analytics_views_session ON analytics_views(session_id);
