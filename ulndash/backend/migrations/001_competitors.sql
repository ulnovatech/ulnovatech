-- Competitors tracking (run once against `ulnovatech` or your DB_NAME)
-- mysql -u root -p ulnovatech < migrations/001_competitors.sql

CREATE TABLE IF NOT EXISTS competitors (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255) NULL,
  description TEXT NULL,
  website VARCHAR(512) NULL,
  threat_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  tags JSON NULL,
  strengths JSON NULL,
  weaknesses JSON NULL,
  mission TEXT NULL,
  company_size VARCHAR(128) NULL,
  location VARCHAR(255) NULL,
  products_services TEXT NULL,
  tech_stack TEXT NULL,
  target_market TEXT NULL,
  pricing_models TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_competitors_active (is_active),
  KEY idx_competitors_created (created_at),
  KEY idx_competitors_threat (threat_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
