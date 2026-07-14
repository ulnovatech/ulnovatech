<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/lib/catalog.php';

$rawSlug = (string) ($_GET['template'] ?? '');
$templateName = uln_resolve_template_id($rawSlug);
$portfolioDir = uln_portfolio_dir();
$baseUrl = '/portfolio/portfolio';

if ($templateName === null || !is_dir($portfolioDir . '/' . $templateName)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Template not found']);
    exit;
}

$scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$domainBase = (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false)
    ? $scheme . '://' . $host . '/ulnovatech'
    : $scheme . '://' . $host;
$templatesBaseUrl = $domainBase . $baseUrl;

$meta = uln_template_meta($templateName);
$imagesDir = $portfolioDir . '/' . $templateName . '/images/';
$screenshots = [];

if (is_dir($imagesDir)) {
    $files = array_diff(scandir($imagesDir), ['.', '..']);
    sort($files);
    foreach ($files as $file) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
            $screenshots[] = $templatesBaseUrl . '/' . $templateName . '/images/' . $file;
        }
    }
}

$mainImage = null;
foreach ($screenshots as $img) {
    if (basename($img) === 'main.png') {
        $mainImage = $img;
        break;
    }
}
if (!$mainImage && count($screenshots) > 0) {
    $mainImage = $screenshots[0];
}

echo json_encode([
    'success' => true,
    'name' => $templateName,
    'title' => $meta['title'],
    'description' => $meta['description'],
    'category' => $meta['category'],
    'mainImage' => $mainImage,
    'screenshots' => $screenshots,
    'thumbnails' => array_slice($screenshots, 0, 6),
    'orderLink' => '/portfolio-app/order?template=' . rawurlencode($templateName),
], JSON_UNESCAPED_SLASHES);
