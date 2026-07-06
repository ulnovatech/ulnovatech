-- P3-R2: audit trail for manual account merges

CREATE TABLE IF NOT EXISTS "account_merge_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "survivor_id" uuid NOT NULL REFERENCES "accounts"("id") ON DELETE CASCADE,
  "merged_id" uuid NOT NULL,
  "merged_normalized_key" varchar(255),
  "operator_id" varchar(100),
  "match_kinds" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_account_merge_log_survivor" ON "account_merge_log" ("survivor_id");
CREATE INDEX IF NOT EXISTS "idx_account_merge_log_created" ON "account_merge_log" ("created_at");
