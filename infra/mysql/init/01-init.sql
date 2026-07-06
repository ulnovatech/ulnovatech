# MySQL init — runs once on first container start (empty data volume).
# Import a full schema dump here as 02-schema.sql if you have one.
# Migrations: docker compose exec php-fpm php /var/www/public_html/ulndash/backend/scripts/apply_admin_mobile_migrations.php

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Placeholder: ensure app can connect; tables created via migrations or manual import.
SELECT 'ulnovatech mysql init complete' AS status;
