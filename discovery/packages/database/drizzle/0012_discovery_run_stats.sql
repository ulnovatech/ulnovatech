ALTER TABLE discovery_runs
  ADD COLUMN IF NOT EXISTS stats jsonb;
