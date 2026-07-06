-- Admin mobile push device registry (FCM tokens)
CREATE TABLE IF NOT EXISTS admin_devices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_username VARCHAR(100) NOT NULL,
  fcm_token VARCHAR(512) NOT NULL,
  platform VARCHAR(32) NOT NULL DEFAULT 'android',
  device_label VARCHAR(120) NULL,
  alerts_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_seen_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_admin_devices_fcm_token (fcm_token),
  KEY idx_admin_devices_username (admin_username),
  KEY idx_admin_devices_alerts (alerts_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
