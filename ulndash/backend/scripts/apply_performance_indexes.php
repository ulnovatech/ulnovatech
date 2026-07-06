<?php
/**
 * Apply performance indexes (idempotent — skips indexes that already exist).
 * Usage: php scripts/apply_performance_indexes.php
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

$sqlFile = __DIR__ . '/../migrations/004_performance_indexes.sql';
$statements = array_filter(
    array_map('trim', explode(';', (string) file_get_contents($sqlFile))),
    static fn (string $line) => $line !== '' && !str_starts_with($line, '--')
);

$applied = 0;
$skipped = 0;

foreach ($statements as $statement) {
    try {
        $pdo->exec($statement);
        $applied++;
        echo "OK: {$statement}\n";
    } catch (PDOException $e) {
        if ((int) $e->errorInfo[1] === 1061 || str_contains($e->getMessage(), 'Duplicate key name')) {
            $skipped++;
            echo "SKIP (exists): {$statement}\n";
            continue;
        }
        throw $e;
    }
}

echo "\nDone. Applied: {$applied}, skipped: {$skipped}\n";
