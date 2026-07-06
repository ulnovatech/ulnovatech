ALTER TABLE "discovery_runs" ADD COLUMN IF NOT EXISTS "run_profile" varchar(20) NOT NULL DEFAULT 'standard';
