<?php
/**
 * Apply all admin-mobile database migrations (idempotent).
 * Usage: php scripts/apply_admin_mobile_migrations.php
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

$files = [
    '005_admin_devices.sql',
    '006_lead_contacts.sql',
];

$dir = __DIR__ . '/../migrations';
$ok = 0;

foreach ($files as $file) {
    $path = $dir . '/' . $file;
    if (!is_file($path)) {
        fwrite(STDERR, "MISSING: {$file}\n");
        exit(1);
    }

    $sql = trim((string) file_get_contents($path));
    try {
        $pdo->exec($sql);
        echo "OK: {$file}\n";
        $ok++;
    } catch (PDOException $e) {
        if (str_contains($e->getMessage(), 'already exists')) {
            echo "SKIP (exists): {$file}\n";
            $ok++;
            continue;
        }
        throw $e;
    }
}

echo "\nAdmin mobile migrations complete ({$ok}/" . count($files) . ").\n";
