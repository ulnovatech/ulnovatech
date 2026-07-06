CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "canonical_name" varchar(300) NOT NULL,
  "normalized_key" varchar(255) NOT NULL,
  "source" varchar(50) NOT NULL,
  "external_id" varchar(255),
  "website" varchar(500),
  "phone" varchar(50),
  "email" varchar(255),
  "city" varchar(100),
  "country" varchar(100),
  "industry" varchar(200),
  "source_url" varchar(1000),
  "google_maps_url" varchar(1000),
  "facebook_url" varchar(1000),
  "instagram_url" varchar(1000),
  "rating" real,
  "review_count" integer,
  "metadata" jsonb,
  "suppressed" boolean DEFAULT false NOT NULL,
  "last_enriched_at" timestamptz,
  "last_places_fetch_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "accounts_normalized_key_unique" UNIQUE("normalized_key")
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_accounts_source_external_id"
  ON "accounts" ("source", "external_id")
  WHERE "external_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "suppression_list" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(255),
  "phone" varchar(50),
  "domain" varchar(255),
  "reason" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "account_id" uuid;
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_account_id_accounts_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE set null ON UPDATE no action;

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "account_id" uuid;
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_business_id_unique";

-- Backfill accounts from existing businesses (one account per external_id or normalized name+geo+source)
INSERT INTO "accounts" (
  "canonical_name", "normalized_key", "source", "external_id",
  "website", "phone", "email", "city", "country", "industry",
  "source_url", "google_maps_url", "facebook_url", "instagram_url",
  "rating", "review_count", "metadata", "last_places_fetch_at", "created_at", "updated_at"
)
SELECT DISTINCT ON (
  CASE
    WHEN "external_id" IS NOT NULL AND trim("external_id") <> '' THEN 'ext:' || "source" || ':' || "external_id"
    ELSE 'key:' || lower(trim("name")) || '|' || lower(coalesce(trim("city"), '')) || '|' || lower(coalesce(trim("country"), '')) || '|' || lower("source")
  END
)
  "name",
  CASE
    WHEN "external_id" IS NOT NULL AND trim("external_id") <> '' THEN 'ext:' || "source" || ':' || "external_id"
    ELSE 'key:' || lower(trim("name")) || '|' || lower(coalesce(trim("city"), '')) || '|' || lower(coalesce(trim("country"), '')) || '|' || lower("source")
  END,
  "source",
  NULLIF(trim("external_id"), ''),
  "website", "phone", "email", "city", "country", "industry",
  "source_url", "google_maps_url", "facebook_url", "instagram_url",
  "rating", "review_count", "metadata",
  CASE WHEN "source" = 'google_maps' THEN "created_at" ELSE NULL END,
  "created_at", "created_at"
FROM "businesses"
ORDER BY
  CASE
    WHEN "external_id" IS NOT NULL AND trim("external_id") <> '' THEN 'ext:' || "source" || ':' || "external_id"
    ELSE 'key:' || lower(trim("name")) || '|' || lower(coalesce(trim("city"), '')) || '|' || lower(coalesce(trim("country"), '')) || '|' || lower("source")
  END,
  "created_at" ASC
ON CONFLICT ("normalized_key") DO NOTHING;

UPDATE "businesses" b
SET "account_id" = a."id"
FROM "accounts" a
WHERE b."account_id" IS NULL
  AND (
    (b."external_id" IS NOT NULL AND trim(b."external_id") <> '' AND a."normalized_key" = 'ext:' || b."source" || ':' || b."external_id")
    OR a."normalized_key" = 'key:' || lower(trim(b."name")) || '|' || lower(coalesce(trim(b."city"), '')) || '|' || lower(coalesce(trim(b."country"), '')) || '|' || lower(b."source")
  );

UPDATE "leads" l
SET "account_id" = b."account_id"
FROM "businesses" b
WHERE l."business_id" = b."id" AND l."account_id" IS NULL AND b."account_id" IS NOT NULL;

-- Leads without account (orphan) — create account from their business row
INSERT INTO "accounts" (
  "canonical_name", "normalized_key", "source", "external_id",
  "website", "phone", "email", "city", "country", "industry",
  "source_url", "google_maps_url", "facebook_url", "instagram_url",
  "rating", "review_count", "metadata", "created_at", "updated_at"
)
SELECT
  b."name",
  'lead:' || l."id"::text,
  b."source",
  NULLIF(trim(b."external_id"), ''),
  b."website", b."phone", b."email", b."city", b."country", b."industry",
  b."source_url", b."google_maps_url", b."facebook_url", b."instagram_url",
  b."rating", b."review_count", b."metadata", b."created_at", b."created_at"
FROM "leads" l
INNER JOIN "businesses" b ON b."id" = l."business_id"
WHERE l."account_id" IS NULL
ON CONFLICT ("normalized_key") DO NOTHING;

UPDATE "leads" l
SET "account_id" = a."id"
FROM "accounts" a
WHERE l."account_id" IS NULL AND a."normalized_key" = 'lead:' || l."id"::text;

ALTER TABLE "leads" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "leads" ADD CONSTRAINT "leads_account_id_accounts_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "leads" ADD CONSTRAINT "leads_account_id_unique" UNIQUE("account_id");

ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_account_id_accounts_id_fk"
  FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "idx_businesses_account_id" ON "businesses" ("account_id");
