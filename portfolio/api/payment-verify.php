<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/cors.php';
require_once __DIR__ . '/lib/schema.php';
require_once __DIR__ . '/lib/complete_order.php';
require_once __DIR__ . '/../../../php/payments/flutterwave.php';
require_once __DIR__ . '/../../../php/payments/packages.php';

uln_portfolio_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = uln_json_input();
$txRef = trim($data['tx_ref'] ?? $_GET['tx_ref'] ?? '');

if ($txRef === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Payment reference is required.']);
    exit;
}

try {
    uln_ensure_order_payments_table($pdo);

    $stmt = $pdo->prepare('SELECT * FROM order_payments WHERE tx_ref = ? LIMIT 1');
    $stmt->execute([$txRef]);
    $payment = $stmt->fetch();

    if (!$payment) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment not found.']);
        exit;
    }

    if ($payment['status'] === 'successful') {
        $packageMeta = uln_package_or_fail($payment['package']);
        echo json_encode([
            'success' => true,
            'status' => 'successful',
            'message' => 'Your deposit was already confirmed. We\'ll contact you shortly with next steps.',
            'reserved' => true,
            'tx_ref' => $txRef,
            'customer_name' => $payment['customer_name'],
            'template' => $payment['template_key'],
            'deposit_label' => uln_format_ugx((int) $payment['amount_ugx']),
            'package_title' => $packageMeta['title'],
        ]);
        exit;
    }

    if (!uln_flutterwave_is_configured()) {
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'message' => 'Payment verification is unavailable. Contact support with ref: ' . $txRef,
        ]);
        exit;
    }

    $transaction = uln_flutterwave_verify_by_reference($txRef);

    $pdo->beginTransaction();
    $result = uln_complete_order_after_payment($pdo, $txRef, $transaction);
    $pdo->commit();

    $packageMeta = uln_package_or_fail($payment['package']);

    echo json_encode([
        'success' => true,
        'status' => 'successful',
        'message' => $result['customer_name'] . ', your deposit is confirmed! We\'ll contact you within 24 hours to collect business details and start building.',
        'reserved' => (bool) $result['reserved'],
        'already_completed' => (bool) $result['already_completed'],
        'tx_ref' => $txRef,
        'customer_name' => $result['customer_name'],
        'template' => $result['template_key'],
        'deposit_label' => uln_format_ugx((int) $result['deposit_ugx']),
        'package_title' => $packageMeta['title'],
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $message = $e->getMessage();
    $isPending = stripos($message, 'not successful') !== false
        || stripos($message, 'pending') !== false;

    http_response_code($isPending ? 202 : 500);
    echo json_encode([
        'success' => false,
        'status' => $isPending ? 'pending' : 'failed',
        'message' => $isPending
            ? 'Payment is still processing. Refresh in a moment or contact us with your reference.'
            : 'Could not verify payment. Contact us with reference: ' . $txRef,
        'tx_ref' => $txRef,
        'error' => $message,
    ]);
}
