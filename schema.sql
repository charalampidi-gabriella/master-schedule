-- Shares the `kv` table from rippner-scheduling. Safe to re-run.
CREATE TABLE IF NOT EXISTS kv (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO kv (key, value, updated_at) VALUES
  ('master_satc',     '{"blocks":[]}', datetime('now')),
  ('master_pharr',    '{"blocks":[]}', datetime('now')),
  ('master_wilco',    '{"blocks":[]}', datetime('now')),
  ('master_programs', '[]', datetime('now'));
