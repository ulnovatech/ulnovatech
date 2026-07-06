<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

file_put_contents(__DIR__.'/debug.log', print_r([
    '__DIR__' => __DIR__,
    'template' => $template,
    'templateDir' => $templateDir,
    'is_dir' => is_dir($templateDir),
    'files' => scandir(__DIR__ . "/../portfolio") ?? []
], true));


header('Content-Type: text/html; charset=utf-8');

$template = $_GET['template'] ?? '';

if (!$template) {
    http_response_code(400);
    echo "Template parameter missing";
    exit;
}

$templateDir = __DIR__ . "/../portfolio/" . $template;

if (!is_dir($templateDir)) {
    http_response_code(404);
    echo "Template not found: " . htmlspecialchars($template);
    exit;
}

// Serve index.html or main template file
$indexFile = $templateDir . "/index.html";

if (!file_exists($indexFile)) {
    http_response_code(404);
    echo "Template index file not found";
    exit;
}

readfile($indexFile);
