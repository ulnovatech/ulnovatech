<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/cors.php';
require_once __DIR__ . '/lib/schema.php';
require_once __DIR__ . '/../../../php/leads/rate_limit.php';
require_once __DIR__ . '/../../../php/payments/flutterwave.php';
require_once __DIR__ . '/../../../php/payments/packages.php';

uln_portfolio_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

uln_rate_limit('payment_init', 8, 3600);

if (!uln_flutterwave_is_configured()) {
    http_response_code(503);
    echo json_encode([
        'success' => false,
        'message' => 'Online payments are not configured yet. Please contact us to complete your order.',
        'code' => 'payments_not_configured',
    ]);
    exit;
}

$data = uln_json_input();

$templateKey = trim($data['template'] ?? $data['websiteName'] ?? '');
$fullName = trim($data['fullName'] ?? '');
$email = trim($data['email'] ?? '');
$phone = trim($data['phone'] ?? '');
$countryCode = trim($data['countryCode'] ?? '+256');
$businessName = trim($data['businessName'] ?? '');
$notes = trim($data['notes'] ?? '');
$packageId = trim($data['package'] ?? 'basic');

if ($templateKey === '' || $fullName === '' || $phone === '' || $email === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Template, full name, email, and phone are required.',
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

try {
    $package = uln_package_or_fail($packageId);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}

$depositUgx = (int) $package['deposit_ugx'];
$fullPhone = preg_replace('/\s+/', '', $countryCode . $phone);

try {
    uln_ensure_order_payments_table($pdo);

    $stmt = $pdo->prepare(
        "SELECT id FROM templates
         WHERE (name = ? OR folder_name = ?)
           AND status = 'available'
         LIMIT 1"
    );
    $stmt->execute([$templateKey, $templateKey]);
    $template = $stmt->fetch();

    if (!$template) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'This template is no longer available. Please choose another design.',
            'code' => 'template_unavailable',
        ]);
        exit;
    }

    $txRef = uln_flutterwave_generate_tx_ref();
    $cfg = uln_flutterwave_config();

    $stmt = $pdo->prepare(
        'INSERT INTO order_payments
         (tx_ref, template_key, customer_name, customer_email, customer_phone, country_code, business_name, notes, package, amount_ugx)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $txRef,
        $templateKey,
        $fullName,
        $email,
        $phone,
        $countryCode,
        $businessName !== '' ? $businessName : null,
        $notes !== '' ? $notes : null,
        $packageId,
        $depositUgx,
    ]);

    try {
        $paymentData = uln_flutterwave_initialize_payment([
            'tx_ref' => $txRef,
            'amount' => (string) $depositUgx,
            'currency' => 'UGX',
            'redirect_url' => $cfg['redirect_url'],
            'payment_options' => 'card,mobilemoneyuganda,banktransfer',
            'customer' => [
                'email' => $email,
                'phonenumber' => $fullPhone,
                'name' => $fullName,
            ],
            'customizations' => [
                'title' => 'UlnovaTech Template Deposit',
                'description' => 'Reserve ' . $templateKey . ' — ' . $package['title'],
                'logo' => $cfg['logo_url'],
            ],
            'meta' => [
                'template' => $templateKey,
                'package' => $packageId,
                'customer_name' => $fullName,
            ],
        ]);
    } catch (Throwable $initError) {
        $pdo->prepare("DELETE FROM order_payments WHERE tx_ref = ?")->execute([$txRef]);
        throw $initError;
    }

    $paymentLink = $paymentData['link'] ?? '';
    if ($paymentLink === '') {
        throw new RuntimeException('Flutterwave did not return a checkout link.');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Redirecting you to secure checkout…',
        'tx_ref' => $txRef,
        'payment_link' => $paymentLink,
        'deposit_ugx' => $depositUgx,
        'deposit_label' => uln_format_ugx($depositUgx),
        'package' => $packageId,
        'public_key' => $cfg['public_key'],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not start payment. Please try again or contact us.',
        'error' => $e->getMessage(),
    ]);
}
