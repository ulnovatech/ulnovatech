<?php
// bootstrap.php - load env, CORS, helpers

function load_env($path)
{
    if (!file_exists($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (trim($line) === '' || str_starts_with(trim($line), '#')) {
            continue;
        }
        [$k, $v] = array_map('trim', explode('=', $line, 2));
        if (!getenv($k)) {
            putenv("$k=$v");
        }
    }
}

load_env(__DIR__ . '/.env');

$appDebug = getenv('APP_DEBUG') === 'true';
if ($appDebug) {
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
    ini_set('display_startup_errors', '0');
    error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
}

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = getenv('ALLOWED_ORIGINS')
    ?: 'http://localhost:5174,http://localhost:5177,http://localhost:3000,http://localhost,https://ulnovatech.store';
$allowedOrigins = array_filter(array_map('trim', explode(',', $allowed)));

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
} elseif ($origin === '' && php_sapi_name() !== 'cli') {
    // Same-origin / server-side requests
} else {
    // Block credentialed cross-origin requests from unknown origins
    if ($origin !== '') {
        http_response_code(403);
        echo json_encode(['error' => 'Origin not allowed']);
        exit;
    }
}

header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_body()
{
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?: []) : [];
}

function respond($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function api_is_public_route(string $method, string $path): bool
{
    if ($method === 'OPTIONS') {
        return true;
    }
    if ($path === '/api/auth/login' && $method === 'POST') {
        return true;
    }
    if ($path === '/api/auth/logout' && $method === 'POST') {
        return true;
    }
    if ($path === '/api/auth/me' && $method === 'GET') {
        return true;
    }
    if ($path === '/api/auth/mobile/login' && $method === 'POST') {
        return true;
    }
    if ($path === '/api/auth/mobile/logout' && $method === 'POST') {
        return true;
    }
    if ($path === '/api/auth/mobile/me' && $method === 'GET') {
        return true;
    }
    return false;
}
