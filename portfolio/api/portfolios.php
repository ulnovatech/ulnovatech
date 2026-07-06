<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $portfolioDir = __DIR__ . "/../portfolio";    
    $baseUrl      = "/portfolio/portfolio";

    // Detect environment and build domain URL
    $scheme = isset($_SERVER['REQUEST_SCHEME']) ? $_SERVER['REQUEST_SCHEME'] : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    
    // For localhost development
    if (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false) {
        $domainBase = $scheme . '://' . $host . '/ulnovatech';
    } else {
        // For production/online
        $domainBase = $scheme . '://' . $host;
    }
    
    $templatesBaseUrl = $domainBase . $baseUrl;

    $templates = [];
    $dirs = array_diff(scandir($portfolioDir), ['.', '..']);

    foreach ($dirs as $dir) {
        $fullPath     = $portfolioDir . '/' . $dir;
        $relativePath = $baseUrl . "/" . $dir;

        if (!is_dir($fullPath) || $dir[0] === '.') continue;

        $title = ucwords(str_replace(['-', '_', '.webflow.io', '-template'], ' ', $dir));
        $description = "A professionally designed template.";
        $entry = $templatesBaseUrl . "/" . $dir . "/";
        $imagesDir   = $fullPath . "/images/";
        $screenshots = [];

        if (is_dir($imagesDir)) {
            $files = array_diff(scandir($imagesDir), ['.', '..']);
            // Sort files for consistent order
            sort($files);
            foreach ($files as $file) {
                $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                    $screenshots[] = $templatesBaseUrl . "/" . $dir . "/images/" . $file;
                }
            }
        }

        // Find main.png as featured image, else first image
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

        // Thumbnails: all images including the featured image, limited to 6
        $thumbnails = array_slice($screenshots, 0, 6);

        $templates[] = [
            "name"        => $dir,
            "title"       => $title,
            "description" => $description,
            "entry"       => $entry,
            "screenshots" => $screenshots,
            "mainImage"   => $mainImage,
            "thumbnails"  => $thumbnails
        ];
    }

    echo json_encode([
        "success"   => true,
        "count"     => count($templates),
        "templates" => $templates
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error"   => $e->getMessage()
    ]);
}
