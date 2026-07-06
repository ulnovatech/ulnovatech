ALTER TABLE "discovery_runs" ADD COLUMN IF NOT EXISTS "boi_narrative" boolean NOT NULL DEFAULT false;
