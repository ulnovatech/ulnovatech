-- Tracks when an admin has contacted a lead (any request source type)
CREATE TABLE IF NOT EXISTS lead_contacts (
  request_type VARCHAR(32) NOT NULL,
  source_id INT UNSIGNED NOT NULL,
  contacted_by VARCHAR(100) NOT NULL,
  channel VARCHAR(32) NOT NULL DEFAULT 'mobile',
  notes VARCHAR(500) NULL,
  contacted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_type, source_id),
  KEY idx_lead_contacts_contacted_at (contacted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
