<?php
// Set CORS headers at the very start (fallback, but handled in .htaccess)
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth/SessionAuth.php';
require_once __DIR__ . '/auth/MobileTokenAuth.php';
require_once __DIR__ . '/auth/ApiAuth.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/CompanyController.php';
require_once __DIR__ . '/controllers/RequestsController.php';
require_once __DIR__ . '/controllers/MobileController.php';
require_once __DIR__ . '/controllers/ImportController.php';
require_once __DIR__ . '/controllers/InteractionController.php';
require_once __DIR__ . '/controllers/CompetitorsController.php';
require_once __DIR__ . '/controllers/ProspectsController.php';

$auth = new SessionAuth();
$mobileAuth = new MobileTokenAuth();
$apiAuth = new ApiAuth($auth, $mobileAuth);
$authController = new AuthController($auth, $mobileAuth);

if (getenv('APP_DEBUG') === 'true') {
    error_log("Request: {$_SERVER['REQUEST_METHOD']} {$_SERVER['REQUEST_URI']} " . json_encode($_GET));
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $path = rtrim($path, '/');
    $apiPos = strpos($path, '/api');
    if ($apiPos !== false) {
        $path = substr($path, $apiPos);
    }

    // Auth routes (public)
    if ($path === '/api/auth/login' && $method === 'POST') {
        $authController->login();
        exit;
    }
    if ($path === '/api/auth/logout' && $method === 'POST') {
        $authController->logout();
        exit;
    }
    if ($path === '/api/auth/me' && $method === 'GET') {
        $authController->me();
        exit;
    }

    if ($path === '/api/auth/mobile/login' && $method === 'POST') {
        $authController->mobileLogin();
        exit;
    }
    if ($path === '/api/auth/mobile/logout' && $method === 'POST') {
        $authController->mobileLogout();
        exit;
    }
    if ($path === '/api/auth/mobile/me' && $method === 'GET') {
        $authController->mobileMe();
        exit;
    }

    if ($path === '/api/analytics/ga' && $method === 'GET') {
        $apiAuth->requireAuth();
        require __DIR__ . '/api/ga.php';
        exit;
    }

    if (!api_is_public_route($method, $path)) {
        $apiAuth->requireAuth();
    }

    $companyController = new CompanyController($pdo);
    $requestsController = new RequestsController($pdo);
    $mobileController = new MobileController($pdo, $requestsController->getSourcesMeta());
    $importController = new ImportController($pdo);
    $interactionController = new InteractionController($pdo);
    $competitorsController = new CompetitorsController($pdo);
    $prospectsController = new ProspectsController($pdo);

    // Normalize path
    $path = rtrim($path, '/');

    if (strpos($path, '/api/companies') === 0) {
        if ($method === 'GET') {
            if (preg_match('#^/api/companies/(\d+)$#', $path, $matches)) {
                $companyController->show($matches[1]);
            } elseif ($path === '/api/companies/stats') {
                $companyController->stats();
            } elseif ($path === '/api/companies/activity') {
                $companyController->activity();
            } elseif ($path === '/api/companies/top-industries') {
                $companyController->topIndustries();
            } else {
                $companyController->index($_GET);
            }
        } elseif ($method === 'POST' && $path === '/api/companies') {
            $companyController->store();
        } elseif ($method === 'PUT' && preg_match('#^/api/companies/(\d+)$#', $path, $matches)) {
            $companyController->update($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/companies/(\d+)$#', $path, $matches)) {
            $companyController->destroy($matches[1]);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }

    if (strpos($path, '/api/competitors') === 0) {
        $path = rtrim($path, '/');
        if ($method === 'GET' && $path === '/api/competitors/stats') {
            http_response_code(200);
            echo json_encode($competitorsController->stats());
        } elseif ($method === 'GET' && preg_match('#^/api/competitors$#', $path)) {
            http_response_code(200);
            echo json_encode($competitorsController->index($_GET));
        } elseif ($method === 'GET' && preg_match('#^/api/competitors/(\d+)$#', $path, $matches)) {
            $row = $competitorsController->show($matches[1]);
            if (isset($row['error'])) {
                http_response_code(404);
            }
            echo json_encode($row);
        } elseif ($method === 'POST' && $path === '/api/competitors') {
            $created = $competitorsController->store();
            if (isset($created['error'])) {
                http_response_code(400);
            } else {
                http_response_code(201);
            }
            echo json_encode($created);
        } elseif ($method === 'PUT' && preg_match('#^/api/competitors/(\d+)$#', $path, $matches)) {
            $row = $competitorsController->update($matches[1]);
            if (isset($row['error'])) {
                http_response_code(404);
            }
            echo json_encode($row);
        } elseif ($method === 'DELETE' && preg_match('#^/api/competitors/(\d+)$#', $path, $matches)) {
            echo json_encode($competitorsController->destroy($matches[1]));
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        exit;
    }

    if (strpos($path, '/api/prospects') === 0) {
        $path = rtrim($path, '/');
        if ($method === 'GET' && $path === '/api/prospects/stats') {
            http_response_code(200);
            echo json_encode($prospectsController->stats());
        } elseif ($method === 'GET' && preg_match('#^/api/prospects$#', $path)) {
            http_response_code(200);
            echo json_encode($prospectsController->index($_GET));
        } elseif ($method === 'GET' && preg_match('#^/api/prospects/(\d+)$#', $path, $matches)) {
            $row = $prospectsController->show($matches[1]);
            if (isset($row['error'])) {
                http_response_code(404);
            }
            echo json_encode($row);
        } elseif ($method === 'POST' && $path === '/api/prospects') {
            $r = $prospectsController->store();
            if (isset($r['error'])) {
                http_response_code(400);
            } else {
                http_response_code(201);
            }
            echo json_encode($r);
        } elseif ($method === 'PUT' && preg_match('#^/api/prospects/(\d+)$#', $path, $matches)) {
            $r = $prospectsController->update($matches[1]);
            if (isset($r['error'])) {
                http_response_code($r['error'] === 'Not found' ? 404 : 400);
            }
            echo json_encode($r);
        } elseif ($method === 'DELETE' && preg_match('#^/api/prospects/(\d+)$#', $path, $matches)) {
            $r = $prospectsController->destroy($matches[1]);
            if (isset($r['error'])) {
                http_response_code(400);
            }
            echo json_encode($r);
        } elseif ($method === 'POST' && preg_match('#^/api/prospects/(\d+)/convert$#', $path, $matches)) {
            $r = $prospectsController->convertToCompany($matches[1]);
            if (isset($r['error'])) {
                http_response_code(400);
            } else {
                http_response_code(201);
            }
            echo json_encode($r);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        exit;
    }

    if ($path === '/api/mobile/summary' && $method === 'GET') {
        echo json_encode($mobileController->summary());
        exit;
    }

    if (strpos($path, '/api/mobile/devices') === 0) {
        $user = $apiAuth->user();
        try {
            if ($method === 'GET') {
                $fcmToken = trim((string) ($_GET['fcm_token'] ?? ''));
                echo json_encode($mobileController->deviceStatus($fcmToken, $user));
            } elseif ($method === 'POST') {
                echo json_encode($mobileController->registerDevice(json_body(), $user));
            } elseif ($method === 'PATCH' || $method === 'PUT') {
                echo json_encode($mobileController->updateDeviceAlerts(json_body(), $user));
            } elseif ($method === 'DELETE') {
                echo json_encode($mobileController->unregisterDevice(json_body(), $user));
            } else {
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
            }
        } catch (InvalidArgumentException $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        } catch (RuntimeException $e) {
            $code = (int) $e->getCode();
            if ($code < 400 || $code > 599) {
                $code = 500;
            }
            http_response_code($code);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        exit;
    }

    if (strpos($path, '/api/mobile/payments/') === 0 && $method === 'GET') {
        $txRef = trim(substr($path, strlen('/api/mobile/payments/')));
        if ($txRef === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Payment reference is required']);
            exit;
        }
        require_once __DIR__ . '/services/OrderPaymentSummaryService.php';
        $paymentService = new OrderPaymentSummaryService($pdo);
        $summary = $paymentService->byTxRef(urldecode($txRef));
        if (!$summary) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Payment not found']);
            exit;
        }
        echo json_encode(['success' => true, 'payment' => $summary]);
        exit;
    }

    if (strpos($path, '/api/requests') === 0) {
        if ($method === 'GET') {
            try {
                if (preg_match('#^/api/requests/(\w+)/(\d+)$#', $path, $matches)) {
                    $result = $requestsController->show($matches[1], $matches[2]);
                    echo json_encode($result);
                } else {
                    $result = $requestsController->index($_GET);
                    echo json_encode($result);
                }
            } catch (Exception $e) {
                $code = (int) $e->getCode();
                if ($code < 400 || $code > 599) {
                    $code = 500;
                }
                http_response_code($code);
                echo json_encode(['error' => $e->getMessage()]);
            }
        } elseif ($method === 'POST' && preg_match('#^/api/requests/(\w+)/(\d+)/contacted$#', $path, $matches)) {
            try {
                $user = $apiAuth->user();
                $username = is_array($user) ? (string) ($user['username'] ?? 'admin') : 'admin';
                $result = $requestsController->markContacted($matches[1], (int) $matches[2], $username, json_body());
                echo json_encode($result);
            } catch (Exception $e) {
                $code = (int) $e->getCode();
                if ($code < 400 || $code > 599) {
                    $code = 500;
                }
                http_response_code($code);
                echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            }
        } elseif ($method === 'POST' && preg_match('#^/api/requests/(\d+)/convert$#', $path, $matches)) {
            $requestsController->convertToCompany($matches[1]);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }

    if (strpos($path, '/api/import') === 0 && $method === 'POST') {
        if ($path === '/api/import/companies') {
            $importController->importCompanies();
        } elseif ($path === '/api/import/competitors') {
            $importController->importCompetitors();
        } elseif ($path === '/api/import/prospects') {
            $importController->importProspects();
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
        }
        exit;
    }

    if (strpos($path, '/api/interactions') === 0) {
        if ($method === 'GET' && $path === '/api/interactions') {
            if (isset($_GET['company_id'])) {
                $interactionController->index($_GET['company_id']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Missing company_id']);
            }
        } elseif ($method === 'POST' && $path === '/api/interactions') {
            $body = json_decode(file_get_contents('php://input'), true);
            $interactionController->create($body);
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
        }
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>