CREATE TABLE IF NOT EXISTS "mh_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "stats" jsonb,
  "error_message" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mh_scan_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "payload" jsonb,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "error_message" text,
  "claimed_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mh_listings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid NOT NULL,
  "platform" varchar(50) NOT NULL,
  "listing_key" varchar(500) NOT NULL,
  "raw_payload" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mh_action_cards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid NOT NULL,
  "rank" integer DEFAULT 0 NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "card" jsonb NOT NULL,
  "approved_at" timestamp with time zone,
  "dismissed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mh_spend_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid,
  "provider" varchar(50) NOT NULL,
  "operation" varchar(100) NOT NULL,
  "cost_usd" numeric(10, 6) DEFAULT '0' NOT NULL,
  "units" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "mh_scan_jobs" ADD CONSTRAINT "mh_scan_jobs_scan_id_mh_scans_id_fk"
    FOREIGN KEY ("scan_id") REFERENCES "mh_scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "mh_listings" ADD CONSTRAINT "mh_listings_scan_id_mh_scans_id_fk"
    FOREIGN KEY ("scan_id") REFERENCES "mh_scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "mh_action_cards" ADD CONSTRAINT "mh_action_cards_scan_id_mh_scans_id_fk"
    FOREIGN KEY ("scan_id") REFERENCES "mh_scans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "mh_spend_ledger" ADD CONSTRAINT "mh_spend_ledger_scan_id_mh_scans_id_fk"
    FOREIGN KEY ("scan_id") REFERENCES "mh_scans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "mh_scan_jobs_scan_id_idx" ON "mh_scan_jobs" ("scan_id");
CREATE INDEX IF NOT EXISTS "mh_listings_scan_id_idx" ON "mh_listings" ("scan_id");
CREATE INDEX IF NOT EXISTS "mh_action_cards_scan_id_idx" ON "mh_action_cards" ("scan_id");
CREATE INDEX IF NOT EXISTS "mh_spend_ledger_scan_id_idx" ON "mh_spend_ledger" ("scan_id");
