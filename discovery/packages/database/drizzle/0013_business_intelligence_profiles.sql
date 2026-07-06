CREATE TABLE IF NOT EXISTS business_intelligence_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE SET NULL,
  discovery_run_id uuid REFERENCES discovery_runs(id) ON DELETE SET NULL,
  profile jsonb NOT NULL,
  completeness_score integer NOT NULL DEFAULT 0,
  enriched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT business_intelligence_profiles_account_id_unique UNIQUE (account_id)
);

CREATE INDEX IF NOT EXISTS business_intelligence_profiles_business_id_idx
  ON business_intelligence_profiles (business_id);
