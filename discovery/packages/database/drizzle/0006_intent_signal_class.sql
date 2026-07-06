ALTER TABLE "intent_signals" ADD COLUMN IF NOT EXISTS "signal_class" varchar(20) NOT NULL DEFAULT 'enrichment';

CREATE UNIQUE INDEX IF NOT EXISTS "intent_signals_source_url_unique"
  ON "intent_signals" ("source_url")
  WHERE "source_url" IS NOT NULL AND "source_url" <> '';
