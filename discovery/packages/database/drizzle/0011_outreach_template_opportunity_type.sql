ALTER TABLE outreach_templates
  ADD COLUMN IF NOT EXISTS opportunity_type VARCHAR(30);

CREATE INDEX IF NOT EXISTS outreach_templates_opportunity_type_idx
  ON outreach_templates (opportunity_type);
