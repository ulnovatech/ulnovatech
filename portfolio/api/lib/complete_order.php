<?php

require_once __DIR__ . '/../../../php/payments/packages.php';
require_once __DIR__ . '/../../../php/payments/flutterwave.php';
require_once __DIR__ . '/../../../php/leads/notify.php';

/**
 * Finalize a paid deposit: reserve template, sync CRM, notify team.
 * Idempotent — safe to call from verify endpoint and webhook.
 */
function uln_complete_order_after_payment(PDO $pdo, string $txRef, array $transaction): array
{
    $stmt = $pdo->prepare('SELECT * FROM order_payments WHERE tx_ref = ? LIMIT 1 FOR UPDATE');
    $stmt->execute([$txRef]);
    $payment = $stmt->fetch();

    if (!$payment) {
        throw new RuntimeException('Payment record not found.');
    }

    if ($payment['status'] === 'successful') {
        return [
            'already_completed' => true,
            'payment' => $payment,
            'reserved' => true,
        ];
    }

    if (!uln_flutterwave_payment_is_successful($transaction)) {
        $stmt = $pdo->prepare("UPDATE order_payments SET status = 'failed', payload = ? WHERE id = ?");
        $stmt->execute([json_encode($transaction), $payment['id']]);
        throw new RuntimeException('Payment was not successful.');
    }

    $paidAmount = (int) round((float) ($transaction['amount'] ?? 0));
    $expectedAmount = (int) $payment['amount_ugx'];
    if ($paidAmount < $expectedAmount) {
        throw new RuntimeException('Paid amount does not match expected deposit.');
    }

    $currency = strtoupper((string) ($transaction['currency'] ?? 'UGX'));
    if ($currency !== 'UGX') {
        throw new RuntimeException('Unexpected payment currency.');
    }

    $templateKey = $payment['template_key'];
    $fullName = $payment['customer_name'];
    $phone = $payment['customer_phone'];
    $countryCode = $payment['country_code'];
    $businessName = $payment['business_name'] ?? '';
    $notes = $payment['notes'] ?? '';
    $package = $payment['package'];
    $packageMeta = uln_package_or_fail($package);
    $fullPhone = preg_replace('/\s+/', '', $countryCode . $phone);
    $flutterwaveTxId = (string) ($transaction['id'] ?? $transaction['tx_id'] ?? '');

    $details = "Package: {$package}\nTemplate: {$templateKey}";
    $details .= "\nDeposit paid: " . uln_format_ugx($expectedAmount);
    $details .= "\nPackage total: " . uln_format_ugx((int) $packageMeta['price_ugx']);
    $details .= "\nPayment ref: {$txRef}";
    if ($flutterwaveTxId !== '') {
        $details .= "\nFlutterwave TX: {$flutterwaveTxId}";
    }
    if ($businessName !== '') {
        $details .= "\nBusiness: {$businessName}";
    }
    if ($notes !== '') {
        $details .= "\nNotes: {$notes}";
    }

    $template = null;
    $orderId = null;
    $reserved = false;

    $stmt = $pdo->prepare(
        "SELECT * FROM templates
         WHERE (name = ? OR folder_name = ?)
           AND status = 'available'
         LIMIT 1"
    );
    $stmt->execute([$templateKey, $templateKey]);
    $template = $stmt->fetch();

    if ($template) {
        $stmt = $pdo->prepare(
            'INSERT INTO orders (template_id, full_name, phone, country_code, business_name, notes, package)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $template['id'],
            $fullName,
            $phone,
            $countryCode,
            $businessName,
            $notes,
            $package,
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare("UPDATE templates SET status = 'reserved', ordered_by = ? WHERE id = ?");
        $stmt->execute([$fullName, $template['id']]);
        $reserved = true;
    }

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
    $websiteOrderId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare(
        "UPDATE order_payments
         SET status = 'successful',
             flutterwave_tx_id = ?,
             order_id = ?,
             paid_at = NOW(),
             payload = ?
         WHERE id = ?"
    );
    $stmt->execute([
        $flutterwaveTxId !== '' ? $flutterwaveTxId : null,
        $orderId,
        json_encode($transaction),
        $payment['id'],
    ]);

    uln_notify_lead('website_order', [
        'source_id' => $websiteOrderId,
        'template' => $templateKey,
        'name' => $fullName,
        'email' => $payment['customer_email'],
        'phone' => $fullPhone,
        'business' => $businessName,
        'package' => $package,
        'deposit_paid' => uln_format_ugx($expectedAmount),
        'payment_ref' => $txRef,
        'reserved_in_catalog' => $reserved ? 'yes' : 'no',
    ]);

    return [
        'already_completed' => false,
        'payment' => array_merge($payment, [
            'status' => 'successful',
            'order_id' => $orderId,
        ]),
        'reserved' => $reserved,
        'template_key' => $templateKey,
        'customer_name' => $fullName,
        'deposit_ugx' => $expectedAmount,
    ];
}
