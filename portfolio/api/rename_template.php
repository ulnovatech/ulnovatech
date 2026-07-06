<?php
require 'db.php';

$category = 'Health'; // Example
$baseDir = $_SERVER['DOCUMENT_ROOT'] . "/portfolio/frontend/portfolio/";
$folders = array_diff(scandir($baseDir), ['.', '..']);

foreach ($folders as $folder) {
    $folderPath = $baseDir . $folder;
    if (is_dir($folderPath)) {
        // Check if already in DB
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM templates WHERE folder_name = ?");
        $stmt->execute([$folder]);
        if ($stmt->fetchColumn() == 0) {
            // Generate next name
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM templates WHERE category = ?");
            $stmt->execute([$category]);
            $count = $stmt->fetchColumn() + 1;
            $name = "$category " . ["One","Core","Line","Prime"][$count-1];
            
            // Insert into DB
            $stmt = $pdo->prepare("INSERT INTO templates (name, category, folder_name) VALUES (?, ?, ?)");
            $stmt->execute([$name, $category, $folder]);
        }
    }
}
echo "Templates updated!";
