ALTER TABLE "discovery_runs" ADD COLUMN IF NOT EXISTS "error_message" text;

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "source_url" varchar(1000);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "external_id" varchar(255);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "google_maps_url" varchar(1000);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "facebook_url" varchar(1000);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(1000);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "rating" real;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "review_count" integer;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

ALTER TABLE "intent_signals" ADD COLUMN IF NOT EXISTS "discovery_run_id" uuid;
ALTER TABLE "intent_signals" ADD COLUMN IF NOT EXISTS "title" varchar(500);
ALTER TABLE "intent_signals" ADD COLUMN IF NOT EXISTS "snippet" text;
ALTER TABLE "intent_signals" ADD COLUMN IF NOT EXISTS "source_url" varchar(1000);

ALTER TABLE "intent_signals" ALTER COLUMN "business_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "businesses_external_id_idx" ON "businesses" ("external_id");
CREATE INDEX IF NOT EXISTS "businesses_source_idx" ON "businesses" ("source");
