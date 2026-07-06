CREATE TABLE IF NOT EXISTS "discovery_runs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "country" varchar(100) NOT NULL,
  "city" varchar(100) NOT NULL,
  "industry" varchar(200) NOT NULL,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "started_at" timestamptz,
  "completed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "businesses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "discovery_run_id" uuid NOT NULL REFERENCES "discovery_runs"("id") ON DELETE cascade,
  "name" varchar(300) NOT NULL,
  "industry" varchar(200),
  "website" varchar(500),
  "phone" varchar(50),
  "email" varchar(255),
  "city" varchar(100),
  "country" varchar(100),
  "source" varchar(100) NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "intent_signals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE cascade,
  "source" varchar(100) NOT NULL,
  "signal_type" varchar(50) NOT NULL,
  "signal_strength" integer DEFAULT 50 NOT NULL,
  "captured_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "website_analyses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL UNIQUE REFERENCES "businesses"("id") ON DELETE cascade,
  "has_website" boolean DEFAULT false NOT NULL,
  "mobile_friendly" boolean,
  "https_enabled" boolean,
  "performance_score" integer,
  "notes" text,
  "analyzed_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lead_scores" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL UNIQUE REFERENCES "businesses"("id") ON DELETE cascade,
  "score" integer NOT NULL,
  "factors" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "computed_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL UNIQUE REFERENCES "businesses"("id") ON DELETE cascade,
  "status" varchar(30) DEFAULT 'NEW' NOT NULL,
  "priority" varchar(20) DEFAULT 'medium' NOT NULL,
  "owner" varchar(100) DEFAULT 'operator' NOT NULL,
  "next_follow_up_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lead_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
  "content" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "lead_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
  "type" varchar(50) NOT NULL,
  "description" text NOT NULL,
  "metadata" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "outreach_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "subject" varchar(500),
  "body" text NOT NULL,
  "channel" varchar(20) DEFAULT 'email' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "outreach_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
  "template_id" uuid REFERENCES "outreach_templates"("id"),
  "subject" varchar(500),
  "body" text NOT NULL,
  "channel" varchar(20) DEFAULT 'email' NOT NULL,
  "sent_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "proposals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE cascade,
  "title" varchar(500) NOT NULL,
  "amount" integer NOT NULL,
  "status" varchar(20) DEFAULT 'draft' NOT NULL,
  "body" text,
  "document_url" varchar(500),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(300) NOT NULL,
  "lead_id" uuid REFERENCES "leads"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "revenue_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE cascade,
  "lead_id" uuid REFERENCES "leads"("id"),
  "proposal_id" uuid REFERENCES "proposals"("id"),
  "amount" integer NOT NULL,
  "type" varchar(20) NOT NULL,
  "closed_at" timestamptz DEFAULT now() NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
