<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/cors.php';
require_once __DIR__ . '/lib/schema.php';
require_once __DIR__ . '/../../../php/leads/rate_limit.php';
require_once __DIR__ . '/../../../php/payments/packages.php';
require_once __DIR__ . '/../../../php/lib/phone.php';

uln_portfolio_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

uln_rate_limit('order_status', 20, 3600);

$data = uln_json_input();
$txRef = trim($data['tx_ref'] ?? $data['reference'] ?? '');
$phone = trim($data['phone'] ?? '');
$countryCode = trim($data['countryCode'] ?? '+256');

if ($txRef === '' || $phone === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Payment reference and phone number are required.',
    ]);
    exit;
}

$fullPhone = preg_replace('/\s+/', '', $countryCode . $phone);

try {
    uln_ensure_order_payments_table($pdo);

    $stmt = $pdo->prepare('SELECT * FROM order_payments WHERE tx_ref = ? LIMIT 1');
    $stmt->execute([$txRef]);
    $payment = $stmt->fetch();

    if (!$payment) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'No order found with that reference. Check your payment confirmation SMS or email.',
            'code' => 'not_found',
        ]);
        exit;
    }

    $storedPhone = preg_replace('/\s+/', '', ($payment['country_code'] ?? '') . ($payment['customer_phone'] ?? ''));
    if (!uln_phones_match($storedPhone, $fullPhone) && !uln_phones_match($payment['customer_phone'], $phone)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Phone number does not match this order reference.',
            'code' => 'phone_mismatch',
        ]);
        exit;
    }

    $packages = uln_packages();
    $packageMeta = $packages[$payment['package']] ?? [
        'title' => ucfirst($payment['package']),
        'price_ugx' => 0,
    ];
    $status = $payment['status'];
    $templateReserved = false;

    if ($status === 'successful') {
        $stmt = $pdo->prepare(
            "SELECT status FROM templates
             WHERE (name = ? OR folder_name = ?)
               AND status IN ('reserved', 'taken')
             LIMIT 1"
        );
        $stmt->execute([$payment['template_key'], $payment['template_key']]);
        $templateReserved = (bool) $stmt->fetch();
    }

    $statusMap = [
        'pending' => [
            'label' => 'Awaiting payment',
            'headline' => 'Complete your deposit to start your build',
            'next_step' => 'Finish payment via Flutterwave, or start again from the portfolio.',
        ],
        'successful' => [
            'label' => 'Deposit confirmed',
            'headline' => 'Deposit confirmed — we\'ll start building soon',
            'next_step' => 'Our team will contact you within 24 hours for your business details.',
        ],
        'failed' => [
            'label' => 'Payment failed',
            'headline' => 'This payment did not go through',
            'next_step' => 'Try again from the portfolio or contact us for help.',
        ],
        'cancelled' => [
            'label' => 'Payment cancelled',
            'headline' => 'Checkout was cancelled',
            'next_step' => 'You can choose a template again anytime from our portfolio.',
        ],
    ];

    $statusInfo = $statusMap[$status] ?? $statusMap['pending'];

    $timeline = [
        ['id' => 'submitted', 'label' => 'Details submitted', 'done' => true],
        ['id' => 'deposit', 'label' => 'Deposit paid', 'done' => $status === 'successful'],
        ['id' => 'reserved', 'label' => 'Build scheduled', 'done' => $status === 'successful' && $templateReserved],
        ['id' => 'build', 'label' => 'Project in progress', 'done' => false],
        ['id' => 'launch', 'label' => 'Ready to launch', 'done' => false],
    ];

    echo json_encode([
        'success' => true,
        'order' => [
            'reference' => $payment['tx_ref'],
            'status' => $status,
            'status_label' => $statusInfo['label'],
            'headline' => $statusInfo['headline'],
            'next_step' => $statusInfo['next_step'],
            'customer_name' => $payment['customer_name'],
            'template' => $payment['template_key'],
            'package' => $payment['package'],
            'package_title' => $packageMeta['title'],
            'deposit_label' => uln_format_ugx((int) $payment['amount_ugx']),
            'package_total_label' => (int) ($packageMeta['price_ugx'] ?? 0) > 0
                ? uln_format_ugx((int) $packageMeta['price_ugx'])
                : null,
            'template_reserved' => $templateReserved,
            'submitted_at' => $payment['created_at'],
            'paid_at' => $payment['paid_at'],
            'timeline' => $timeline,
        ],
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Could not look up your order. Please try again.',
        'error' => $e->getMessage(),
    ]);
}
