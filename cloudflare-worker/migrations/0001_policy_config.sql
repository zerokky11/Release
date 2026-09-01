CREATE TABLE IF NOT EXISTS policy_config (
  path TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  etag TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policy_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  etag TEXT NOT NULL,
  archived_at_utc TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_policy_history_path_time
  ON policy_history(path, archived_at_utc DESC);
