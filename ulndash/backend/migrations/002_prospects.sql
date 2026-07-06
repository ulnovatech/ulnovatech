-- Prospects (cold-call list) — run in phpMyAdmin against your DB (e.g. ulnovatech)

CREATE TABLE IF NOT EXISTS prospects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255) NULL,
  location VARCHAR(255) NULL,
  source VARCHAR(255) NULL COMMENT 'e.g. LinkedIn, Google search',
  priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
  notes TEXT NULL COMMENT 'Research notes before calling',
  status ENUM('not_contacted', 'contacted', 'qualified', 'converted_to_company') NOT NULL DEFAULT 'not_contacted',
  company_id INT UNSIGNED NULL COMMENT 'Set when converted to a Companies row',
  contacted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prospects_status (status),
  KEY idx_prospects_priority (priority),
  KEY idx_prospects_created (created_at),
  KEY idx_prospects_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: add FK if companies.id is INT UNSIGNED and matches:
-- ALTER TABLE prospects ADD CONSTRAINT fk_prospects_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
