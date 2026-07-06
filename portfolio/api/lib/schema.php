<?php

function uln_ensure_order_payments_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS order_payments (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            tx_ref VARCHAR(64) NOT NULL,
            flutterwave_tx_id VARCHAR(64) NULL,
            order_id INT UNSIGNED NULL,
            template_key VARCHAR(255) NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64) NOT NULL,
            country_code VARCHAR(8) NOT NULL DEFAULT '+256',
            business_name VARCHAR(255) NULL,
            notes TEXT NULL,
            package VARCHAR(32) NOT NULL,
            amount_ugx INT UNSIGNED NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'UGX',
            status ENUM('pending','successful','failed','cancelled') NOT NULL DEFAULT 'pending',
            payload JSON NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            paid_at TIMESTAMP NULL DEFAULT NULL,
            UNIQUE KEY uq_order_payments_tx_ref (tx_ref),
            KEY idx_order_payments_status (status),
            KEY idx_order_payments_template (template_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
}
