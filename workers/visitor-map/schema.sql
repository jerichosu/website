CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  visitor_hash TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL,
  lat REAL,
  lon REAL,
  asn INTEGER,
  org TEXT NOT NULL,
  os TEXT NOT NULL,
  browser TEXT NOT NULL,
  device TEXT NOT NULL,
  page TEXT NOT NULL,
  referrer TEXT NOT NULL,
  ip_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts DESC);
CREATE INDEX IF NOT EXISTS idx_visits_hash ON visits(visitor_hash);
CREATE INDEX IF NOT EXISTS idx_visits_geo ON visits(country, city);
