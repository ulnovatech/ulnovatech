-- Operator readiness: demand inbox + lead re-engagement (R3/R4 schema)

ALTER TABLE "intent_signals" ADD COLUMN IF NOT EXISTS "dismissed_at" timestamptz;

INSERT INTO "discovery_runs" (
  "id",
  "country",
  "city",
  "industry",
  "status",
  "run_profile",
  "completed_at",
  "created_at"
)
VALUES (
  'a0000000-0000-4000-8000-000000000008',
  'n/a',
  'n/a',
  'demand',
  'completed',
  'micro',
  now(),
  now()
)
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_account_id_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "leads_one_active_per_account"
  ON "leads" ("account_id")
  WHERE "status" NOT IN ('CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED');
