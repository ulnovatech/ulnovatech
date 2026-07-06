CREATE TABLE IF NOT EXISTS "gmail_reply_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "gmail_message_id" varchar(200) NOT NULL,
  "thread_id" varchar(200),
  "from_email" varchar(300),
  "subject" varchar(500),
  "snippet" text,
  "received_at" timestamp with time zone,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "gmail_reply_suggestions_message_unique" UNIQUE("gmail_message_id")
);

CREATE INDEX IF NOT EXISTS "idx_gmail_reply_suggestions_lead_id" ON "gmail_reply_suggestions" ("lead_id");
CREATE INDEX IF NOT EXISTS "idx_gmail_reply_suggestions_status" ON "gmail_reply_suggestions" ("status");
