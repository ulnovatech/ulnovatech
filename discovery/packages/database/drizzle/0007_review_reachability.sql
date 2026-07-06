ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "review_snoozed_until" timestamptz;

ALTER TABLE "lead_scores" ADD COLUMN IF NOT EXISTS "reachability" varchar(20);

CREATE INDEX IF NOT EXISTS "lead_scores_reachability_idx" ON "lead_scores" ("reachability");
CREATE INDEX IF NOT EXISTS "accounts_review_snoozed_until_idx" ON "accounts" ("review_snoozed_until");
