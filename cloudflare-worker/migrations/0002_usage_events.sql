CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  received_at_utc TEXT NOT NULL,
  client_event_id TEXT NOT NULL UNIQUE,
  session_id TEXT NOT NULL,
  product TEXT NOT NULL,
  event_name TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  profile_source TEXT NOT NULL,
  machine_hash TEXT NOT NULL,
  addin_version TEXT NOT NULL,
  revit_version TEXT NOT NULL,
  access_allowed INTEGER NOT NULL,
  client_time_utc TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  country TEXT NOT NULL,
  user_agent TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_received
  ON usage_events(received_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_profile_received
  ON usage_events(profile_name, received_at_utc DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_product_received
  ON usage_events(product, received_at_utc DESC);
