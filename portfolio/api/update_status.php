<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
require '../db.php';

$id = intval($_GET['id'] ?? 0);
$requested = $_GET['status'] ?? 'available';
$allowed = ['available', 'reserved', 'taken'];
$status = in_array($requested, $allowed, true) ? $requested : 'available';

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid template ID"]);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE templates SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);

    echo json_encode(["success" => true, "message" => "Template status updated"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
