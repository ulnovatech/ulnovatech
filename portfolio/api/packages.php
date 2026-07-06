<?php

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/lib/cors.php';
require_once __DIR__ . '/lib/schema.php';
require_once __DIR__ . '/../../../php/payments/packages.php';

uln_portfolio_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$packages = uln_packages();
$list = [];

foreach ($packages as $id => $meta) {
    $list[] = [
        'id' => $id,
        'title' => $meta['title'],
        'priceUgx' => (int) $meta['price_ugx'],
        'depositUgx' => (int) $meta['deposit_ugx'],
        'priceLabel' => uln_format_ugx((int) $meta['price_ugx']),
        'depositLabel' => uln_format_ugx((int) $meta['deposit_ugx']),
        'badge' => $meta['badge'],
    ];
}

echo json_encode([
    'success' => true,
    'packages' => $list,
]);
