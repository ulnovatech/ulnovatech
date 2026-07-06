<?php
require __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/controllers/CompanyController.php';
require_once __DIR__ . '/controllers/InteractionController.php';

// Load env
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// --- CORS ---
$allowed_origins = explode(',', $_ENV['ALLOWED_ORIGINS'] ?? '*');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array('*', $allowed_origins) || in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- INIT ---
$pdo = db();
$companyController = new CompanyController($pdo);
$interactionController = new InteractionController($pdo);

// --- ROUTES ---
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

switch (true) {
    case preg_match('#^/api/companies$#', $request_uri):
        if ($method === 'GET') $companyController->index();
        if ($method === 'POST') $companyController->store();
        break;

    case preg_match('#^/api/companies/(\d+)$#', $request_uri, $matches):
        $id = (int)$matches[1];
        if ($method === 'GET') $companyController->show($id);
        if ($method === 'PUT') $companyController->update($id);
        if ($method === 'DELETE') $companyController->destroy($id);
        break;

    case preg_match('#^/api/companies/stats$#', $request_uri):
        if ($method === 'GET') $companyController->stats();
        break;

    case preg_match('#^/api/interactions$#', $request_uri):
        if ($method === 'POST') $interactionController->store();
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Route not found']);
}
