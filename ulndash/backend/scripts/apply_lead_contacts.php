<?php
/**
 * Create lead_contacts table (idempotent).
 * Usage: php scripts/apply_lead_contacts.php
 */

require_once __DIR__ . '/../../../php/env.php';
require_once __DIR__ . '/../bootstrap.php';

$host = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'ulnovatech';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';

$dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $host, $dbName);

$pdo = new PDO(
    $dsn,
    $user,
    $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$sqlFile = __DIR__ . '/../migrations/006_lead_contacts.sql';
$sql = trim((string) file_get_contents($sqlFile));

try {
    $pdo->exec($sql);
    echo "OK: lead_contacts table ready.\n";
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'already exists')) {
        echo "SKIP: lead_contacts already exists.\n";
        exit(0);
    }
    throw $e;
}
