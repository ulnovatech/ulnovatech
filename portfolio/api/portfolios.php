<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/lib/catalog.php';

try {
    $portfolioDir = uln_portfolio_dir();
    $baseUrl = "/portfolio/portfolio";

    $scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';

    if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
        $domainBase = $scheme . '://' . $host . '/ulnovatech';
    } else {
        $domainBase = $scheme . '://' . $host;
    }

    $templatesBaseUrl = $domainBase . $baseUrl;

    $templates = [];
    $dirs = array_diff(scandir($portfolioDir), ['.', '..']);

    foreach ($dirs as $dir) {
        $fullPath = $portfolioDir . '/' . $dir;
        if (!is_dir($fullPath) || $dir[0] === '.') {
            continue;
        }

        $meta = uln_template_meta($dir);
        $entry = $templatesBaseUrl . "/" . $dir . "/";
        $imagesDir = $fullPath . "/images/";
        $screenshots = [];

        if (is_dir($imagesDir)) {
            $files = array_diff(scandir($imagesDir), ['.', '..']);
            sort($files);
            foreach ($files as $file) {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
                    $screenshots[] = $templatesBaseUrl . "/" . $dir . "/images/" . $file;
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

        $templates[] = [
            "name" => $dir,
            "title" => $meta['title'],
            "description" => $meta['description'],
            "category" => $meta['category'],
            "entry" => $entry,
            "screenshots" => $screenshots,
            "mainImage" => $mainImage,
            "thumbnails" => array_slice($screenshots, 0, 6),
        ];
    }

    echo json_encode([
        "success" => true,
        "count" => count($templates),
        "templates" => $templates,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
    ]);
}
