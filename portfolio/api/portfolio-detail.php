<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$templateName = basename($_GET['template'] ?? '');
$portfolioDir = __DIR__ . '/../portfolio';
$baseUrl = '/portfolio/portfolio';

if ($templateName === '' || !is_dir($portfolioDir . '/' . $templateName)) {
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

$title = ucwords(str_replace(['-', '_', '.webflow.io', '-template'], ' ', $templateName));
$description = 'A professionally designed template.';
$imagesDir = $portfolioDir . '/' . $templateName . '/images/';
$screenshots = [];

if (is_dir($imagesDir)) {
    $files = array_diff(scandir($imagesDir), ['.', '..']);
    sort($files);
    foreach ($files as $file) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
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
    'title' => $title,
    'description' => $description,
    'mainImage' => $mainImage,
    'screenshots' => $screenshots,
    'thumbnails' => array_slice($screenshots, 0, 6),
    'orderLink' => '/order?template=' . rawurlencode($templateName),
], JSON_UNESCAPED_SLASHES);
