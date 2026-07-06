<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/schema.php';
require_once __DIR__ . '/lib/complete_order.php';
require_once __DIR__ . '/../../../php/payments/flutterwave.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $payload = uln_flutterwave_verify_webhook();
    $event = $payload['event'] ?? '';
    $data = $payload['data'] ?? [];

    if ($event !== 'charge.completed' || !is_array($data)) {
        echo json_encode(['success' => true, 'message' => 'Ignored']);
        exit;
    }

    $txRef = trim((string) ($data['tx_ref'] ?? ''));
    if ($txRef === '') {
        throw new RuntimeException('Missing tx_ref in webhook payload.');
    }

    uln_ensure_order_payments_table($pdo);
    $pdo->beginTransaction();
    uln_complete_order_after_payment($pdo, $txRef, $data);
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Webhook processed']);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
