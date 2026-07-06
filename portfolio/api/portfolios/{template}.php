<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$templateName = basename($_GET['template'] ?? '');
$portfolioDir = __DIR__ . '/../portfolio';
$baseUrl = '/portfolio/';

if (empty($templateName) || !is_dir($portfolioDir . '/' . $templateName)) {
    http_response_code(404);
    echo json_encode(['message' => 'Template not found']);
    exit;
}

// Load metadata
$metaFile = $portfolioDir . '/' . $templateName . '/metadata.json';
$meta = [
    'title' => ucfirst($templateName), 
    'description' => 'Description for ' . ucfirst($templateName),
    'category' => ucfirst($templateName)
];

if (file_exists($metaFile)) {
    $meta = array_merge($meta, json_decode(file_get_contents($metaFile), true) ?? []);
}

// Get screenshots
$screenshotsDir = $portfolioDir . '/' . $templateName . '/images/screenshots';
$screenshots = [];
$mainImage = null;

if (is_dir($screenshotsDir)) {
    $files = array_diff(scandir($screenshotsDir), ['.', '..']);
    foreach ($files as $file) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        if (in_array(strtolower($ext), ['jpg', 'jpeg', 'png', 'gif'])) {
            $path = $baseUrl . $templateName . '/images/screenshots/' . $file;
            $screenshots[] = $path;
            if (stripos($file, 'main') === 0) {
                $mainImage = $path;
            }
        }
    }
}

if (!$mainImage && !empty($screenshots)) {
    $mainImage = $screenshots[0];
}

if (!$mainImage) {
    http_response_code(404);
    echo json_encode(['message' => 'No images found for this template']);
    exit;
}

echo json_encode([
    'name' => $templateName,
    'title' => $meta['title'],
    'description' => $meta['description'],
    'category' => $meta['category'],
    'mainImage' => $mainImage,
    'screenshots' => $screenshots,
    'link' => "/order?template={$templateName}"
]);
?>