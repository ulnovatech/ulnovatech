CREATE TABLE IF NOT EXISTS "acquisition_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "run_id" uuid NOT NULL REFERENCES "discovery_runs"("id") ON DELETE cascade,
  "stage" varchar(50) NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "payload" jsonb,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "error_message" text,
  "claimed_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_acquisition_jobs_run_id" ON "acquisition_jobs" ("run_id");
CREATE INDEX IF NOT EXISTS "idx_acquisition_jobs_status" ON "acquisition_jobs" ("status");

CREATE TABLE IF NOT EXISTS "budget_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" varchar(50) NOT NULL,
  "operation" varchar(50) NOT NULL,
  "units" integer DEFAULT 1 NOT NULL,
  "run_id" uuid REFERENCES "discovery_runs"("id") ON DELETE set null,
  "account_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_budget_ledger_provider_created" ON "budget_ledger" ("provider", "created_at");

CREATE TABLE IF NOT EXISTS "acquisition_settings" (
  "key" varchar(100) PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
