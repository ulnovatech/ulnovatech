<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../../php/leads/notify.php';
require_once __DIR__ . '/../../php/leads/rate_limit.php';

uln_rate_limit('website_order', 12, 3600);

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request body']);
    exit;
}

$templateKey = trim($data['template'] ?? $data['websiteName'] ?? '');
$fullName = trim($data['fullName'] ?? '');
$phone = trim($data['phone'] ?? '');
$countryCode = trim($data['countryCode'] ?? '+256');
$businessName = trim($data['businessName'] ?? '');
$notes = trim($data['notes'] ?? '');
$package = trim($data['package'] ?? 'basic');

if ($templateKey === '' || $fullName === '' || $phone === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Template, full name, and phone are required.',
    ]);
    exit;
}

$fullPhone = preg_replace('/\s+/', '', $countryCode . $phone);
$details = "Package: {$package}\nTemplate: {$templateKey}";
if ($businessName !== '') {
    $details .= "\nBusiness: {$businessName}";
}
if ($notes !== '') {
    $details .= "\nNotes: {$notes}";
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO website_orders (template, name, phone, business, details) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $templateKey,
        $fullName,
        $fullPhone,
        $businessName,
        $details,
    ]);

    $orderId = (int) $pdo->lastInsertId();

    $pdo->commit();

    uln_notify_lead('website_order', [
        'source_id' => $orderId,
        'template' => $templateKey,
        'name' => $fullName,
        'phone' => $fullPhone,
        'business' => $businessName,
        'package' => $package,
        'notes' => $notes,
        'quote_only' => 'yes',
    ]);

    echo json_encode([
        'success' => true,
        'message' => "{$fullName}, your quote request was received. Pay the deposit anytime to reserve your template.",
        'reserved' => false,
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not submit your request. Please try again.',
        'error' => $e->getMessage(),
    ]);
}
