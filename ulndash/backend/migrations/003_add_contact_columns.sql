-- Add structured contact fields to companies and prospects

ALTER TABLE companies
  ADD COLUMN contact_phone VARCHAR(64) NULL AFTER contact_method,
  ADD COLUMN contact_email VARCHAR(255) NULL AFTER contact_phone,
  ADD COLUMN contact_whatsapp VARCHAR(64) NULL AFTER contact_email;

ALTER TABLE prospects
  ADD COLUMN contact_phone VARCHAR(64) NULL AFTER source,
  ADD COLUMN contact_email VARCHAR(255) NULL AFTER contact_phone,
  ADD COLUMN contact_method ENUM('phone','whatsapp','email','social') NOT NULL DEFAULT 'phone' AFTER contact_email;
