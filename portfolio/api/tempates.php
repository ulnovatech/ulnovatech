<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require '../db.php';

try {
    $stmt = $pdo->prepare("SELECT * FROM templates WHERE status = 'available'");
    $stmt->execute();
    $templates = $stmt->fetchAll();

    echo json_encode(["success" => true, "templates" => $templates]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
