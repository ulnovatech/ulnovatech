<?php
require_once __DIR__ . '/env.php';

// =====================================
// CONFIG INDEX
// 1. Environment Detection
// 2. Base URL
// 3. Database Settings
// 4. Database Connection
// 5. Debug Settings
// =====================================

// 1️⃣ Environment Detection
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$baseUrl = getenv('BASE_URL') ?: '';
$isLocalHost = $httpHost === 'localhost'
    || str_starts_with($httpHost, '127.0.0.1')
    || str_starts_with($httpHost, 'localhost:');
$isLocalBaseUrl = str_contains($baseUrl, 'localhost') || str_contains($baseUrl, '127.0.0.1');
$ENV = ($isLocalHost || $isLocalBaseUrl) ? 'local' : 'production';

// 2️⃣ Base URL
$BASE_URL = getenv('BASE_URL') ?: ($ENV === 'local' ? 'http://localhost/ulnovatech' : 'https://ulnovatech.store');

// 3️⃣ Database Settings
$DB = [
    'host' => getenv('DB_HOST') ?: ($ENV === 'local' ? 'localhost' : ''),
    'user' => getenv('DB_USER') ?: ($ENV === 'local' ? 'root' : ''),
    'pass' => getenv('DB_PASS') ?: ($ENV === 'local' ? '' : ''),
    'name' => getenv('DB_NAME') ?: ($ENV === 'local' ? 'ulnovatech' : ''),
    'port' => getenv('DB_PORT') ?: 3306,
];

// Back-compat variables expected by legacy handlers (e.g. contactus.php)
$db_host = $DB['host'];
$db_user = $DB['user'];
$db_pass = $DB['pass'];
$db_name = $DB['name'];
$db_port = (int)$DB['port'];

/**
 * Exit with JSON for API form handlers that include this config.
 */
function uln_config_fail(int $code, string $message): void
{
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
    }
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit;
}

// Fail fast in production if env vars are missing (avoid hardcoded secrets in source)
if ($ENV !== 'local') {
    $missing = [];
    foreach (['DB_HOST', 'DB_USER', 'DB_NAME'] as $key) {
        if (getenv($key) === false || getenv($key) === '') {
            $missing[] = $key;
        }
    }
    // Empty password is valid (e.g. some local setups); only fail when unset
    if (getenv('DB_PASS') === false) {
        $missing[] = 'DB_PASS';
    }
    if (!empty($missing)) {
        uln_config_fail(500, 'Server configuration error. Please contact support.');
    }
}

// 4️⃣ Database Connection
$conn = new mysqli($DB['host'], $DB['user'], $DB['pass'], $DB['name'], $DB['port']);
if ($conn->connect_error) {
    $detail = $ENV === 'local' ? $conn->connect_error : 'Database unavailable.';
    uln_config_fail(500, 'Database connection failed: ' . $detail);
}

// 5️⃣ Debug Settings (only local)
if ($ENV === 'local') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
}
