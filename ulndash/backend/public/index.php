<?php
// Handle preflight requests immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Content-Type: application/json; charset=utf-8');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Credentials: true');
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../controllers/CompanyController.php';
require_once __DIR__ . '/../controllers/InteractionController.php';
require_once __DIR__ . '/../controllers/ImportController.php';
require_once __DIR__ . '/../controllers/RequestsController.php';
require_once __DIR__ . '/../controllers/CompetitorsController.php';
require_once __DIR__ . '/../controllers/ProspectsController.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#/+$#', '', $uri);
$basePath = dirname($_SERVER['SCRIPT_NAME']);
$basePath = preg_replace('#/+$#', '', $basePath);
if (strpos($path, $basePath) === 0) {
    $path = substr($path, strlen($basePath));
}
if (isset($_GET['url'])) {
    $path = '/' . trim($_GET['url'], '/');
    $path = preg_replace('#/+#', '/', $path);
} elseif (isset($_GET['r'])) {
    $path = '/' . trim($_GET['r'], '/');
}
$segments = array_values(array_filter(explode('/', $path)));

$ctlCompany = new CompanyController($pdo);
$ctlInteraction = new InteractionController($pdo);
$ctlImport = new ImportController($pdo);
$ctlRequests = new RequestsController($pdo);
$ctlCompetitors = new CompetitorsController($pdo);
$ctlProspects = new ProspectsController($pdo);

if (!function_exists('respond')) {
    function respond($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
if (!function_exists('json_body')) {
    function json_body() {
        $data = json_decode(file_get_contents('php://input'), true);
        return $data ?: [];
    }
}

try {
    if (count($segments) >= 1 && $segments[0] === 'api') {

        // /api/companies ...
        if (isset($segments[1]) && $segments[1] === 'companies') {
            if ($method === 'GET' && count($segments) === 2) { respond($ctlCompany->index($_GET)); }
            elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'stats') { respond($ctlCompany->stats()); }
            elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'activity') { respond($ctlCompany->activity()); }
            elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'top-industries') { respond($ctlCompany->topIndustries()); }
            elseif ($method === 'POST' && count($segments) === 2) { respond($ctlCompany->store()); }
            elseif (count($segments) >= 3 && is_numeric($segments[2])) {
                $id = (int)$segments[2];
                if ($method === 'GET' && count($segments) === 3) $ctlCompany->show($id);
                elseif ($method === 'PUT' && count($segments) === 3) $ctlCompany->update($id);
                elseif ($method === 'DELETE' && count($segments) === 3) $ctlCompany->destroy($id);
                elseif ($method === 'GET' && isset($segments[3]) && $segments[3] === 'interactions') $ctlInteraction->index($id);
                else respond(['error'=>'Not implemented'],404);
            } else respond(['error'=>'Not found'],404);
        }

        // /api/interactions
        elseif (isset($segments[1]) && $segments[1] === 'interactions') {
            if ($method === 'POST') $ctlInteraction->create(json_body());
            else respond(['error'=>'Not allowed'],405);
        }

        // /api/import/companies | /api/import/competitors
        elseif (isset($segments[1]) && $segments[1] === 'import') {
            if ($method === 'POST' && isset($segments[2]) && $segments[2] === 'companies') {
                $ctlImport->importCompanies();
            } elseif ($method === 'POST' && isset($segments[2]) && $segments[2] === 'competitors') {
                $ctlImport->importCompetitors();
            } elseif ($method === 'POST' && isset($segments[2]) && $segments[2] === 'prospects') {
                $ctlImport->importProspects();
            } else {
                respond(['error'=>'Not found'],404);
            }
        }

        // /api/competitors
        elseif (isset($segments[1]) && $segments[1] === 'competitors') {
            if ($method === 'GET' && count($segments) === 2) {
                respond($ctlCompetitors->index($_GET));
            } elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'stats') {
                respond($ctlCompetitors->stats());
            } elseif ($method === 'GET' && count($segments) === 3 && is_numeric($segments[2])) {
                $r = $ctlCompetitors->show((int)$segments[2]);
                if (isset($r['error'])) {
                    respond($r, 404);
                }
                respond($r);
            } elseif ($method === 'POST' && count($segments) === 2) {
                $r = $ctlCompetitors->store();
                if (isset($r['error'])) {
                    respond($r, 400);
                }
                respond($r, 201);
            } elseif (count($segments) === 3 && is_numeric($segments[2])) {
                $id = (int)$segments[2];
                if ($method === 'PUT') {
                    $r = $ctlCompetitors->update($id);
                    if (isset($r['error'])) {
                        respond($r, 404);
                    }
                    respond($r);
                } elseif ($method === 'DELETE') {
                    respond($ctlCompetitors->destroy($id));
                } else {
                    respond(['error' => 'Not allowed'], 405);
                }
            } else {
                respond(['error' => 'Not found'], 404);
            }
        }

        // /api/prospects
        elseif (isset($segments[1]) && $segments[1] === 'prospects') {
            if ($method === 'GET' && count($segments) === 2) {
                respond($ctlProspects->index($_GET));
            } elseif ($method === 'GET' && count($segments) === 3 && $segments[2] === 'stats') {
                respond($ctlProspects->stats());
            } elseif ($method === 'GET' && count($segments) === 3 && is_numeric($segments[2])) {
                $r = $ctlProspects->show((int)$segments[2]);
                if (isset($r['error'])) {
                    respond($r, 404);
                }
                respond($r);
            } elseif ($method === 'POST' && count($segments) === 2) {
                $r = $ctlProspects->store();
                if (isset($r['error'])) {
                    respond($r, 400);
                }
                respond($r, 201);
            } elseif (count($segments) === 4 && is_numeric($segments[2]) && $segments[3] === 'convert' && $method === 'POST') {
                $r = $ctlProspects->convertToCompany((int)$segments[2]);
                if (isset($r['error'])) {
                    respond($r, 400);
                }
                respond($r, 201);
            } elseif (count($segments) === 3 && is_numeric($segments[2])) {
                $id = (int)$segments[2];
                if ($method === 'PUT') {
                    $r = $ctlProspects->update($id);
                    if (isset($r['error'])) {
                        respond($r, $r['error'] === 'Not found' ? 404 : 400);
                    }
                    respond($r);
                } elseif ($method === 'DELETE') {
                    $r = $ctlProspects->destroy($id);
                    if (isset($r['error'])) {
                        respond($r, 400);
                    }
                    respond($r);
                } else {
                    respond(['error' => 'Not allowed'], 405);
                }
            } else {
                respond(['error' => 'Not found'], 404);
            }
        }

        // /api/requests  <-- NEW endpoint
        elseif (isset($segments[1]) && $segments[1] === 'requests') {
            // GET /api/requests
            if ($method === 'GET' && count($segments) === 2) {
                respond($ctlRequests->index($_GET));
            }
            // GET /api/requests/{type}/{id}
            elseif ($method === 'GET' && isset($segments[2]) && isset($segments[3]) && is_numeric($segments[3])) {
                $type = $segments[2];
                $id = (int)$segments[3];
                respond($ctlRequests->show($type, $id));
            } else {
                respond(['error'=>'Not allowed or not found'], 405);
            }
        }

        // /api/stats and children
        elseif (isset($segments[1]) && $segments[1] === 'stats') {
            if ($method === 'GET' && count($segments) === 2) $ctlCompany->stats();
            elseif ($method === 'GET' && isset($segments[2]) && $segments[2] === 'activity') $ctlCompany->activity();
            elseif ($method === 'GET' && isset($segments[2]) && $segments[2] === 'industries' && isset($segments[3]) && $segments[3] === 'top') $ctlCompany->topIndustries();
            else respond(['error'=>'Not allowed or not found'], 405);
        }

        else {
            respond(['error'=>'Route not found'], 404);
        }

    } else {
        respond(['message'=>'Reachout API. Use /api/...'], 200);
    }
} catch (Exception $e) {
    $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
    respond(['error'=>'Server error', 'details' => getenv('APP_DEBUG') ? $e->getMessage() : null], $status);
}
