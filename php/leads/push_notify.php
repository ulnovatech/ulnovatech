<?php

/**
 * Dispatch FCM push alerts to registered admin devices.
 */
function uln_dispatch_lead_push(string $type, array $payload): void
{
    try {
        $projectId = getenv('FCM_PROJECT_ID') ?: getenv('FIREBASE_PROJECT_ID');
        if (!$projectId) {
            return;
        }

        $backendRoot = dirname(__DIR__, 2) . '/ulndash/backend';
        $serviceFile = $backendRoot . '/services/PushNotificationService.php';
        if (!is_file($serviceFile)) {
            return;
        }

        require_once $backendRoot . '/vendor/autoload.php';
        require_once $serviceFile;

        $pdo = uln_push_pdo();
        if (!$pdo) {
            return;
        }

        $service = new PushNotificationService($pdo);
        if (!$service->isConfigured()) {
            return;
        }

        $service->sendLeadAlert($type, $payload);
    } catch (Throwable $e) {
        error_log('Lead push failed: ' . $e->getMessage());
    }
}

function uln_push_pdo(): ?PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: 'localhost';
    $dbName = getenv('DB_NAME') ?: 'ulnovatech';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';
    $port = getenv('DB_PORT') ?: '3306';

    try {
        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $dbName);
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        return $pdo;
    } catch (Throwable $e) {
        error_log('Push PDO connection failed: ' . $e->getMessage());
        return null;
    }
}
