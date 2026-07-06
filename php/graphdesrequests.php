<?php
ob_start(); // Start output buffering to capture any unintended output
header('Content-Type: application/json; charset=UTF-8');

// Load database config
require_once(__DIR__ . '/config.php');
require_once(__DIR__ . '/leads/notify.php');
require_once(__DIR__ . '/leads/rate_limit.php');

uln_rate_limit('graphdesrequests');

// Connect to database
$con = mysqli_connect($db_host, $db_user, $db_pass, $db_name, $db_port);
if (!$con) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to database.']);
    ob_end_flush();
    exit;
}

// Sanitize inputs
$name = mysqli_real_escape_string($con, $_POST['name'] ?? '');
$phone = mysqli_real_escape_string($con, $_POST['phone'] ?? '');
$description = mysqli_real_escape_string($con, $_POST['description'] ?? '');

// Validate inputs
if (empty($name) || empty($phone) || empty($description)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
    mysqli_close($con);
    ob_end_flush();
    exit;
}

// Insert data
$query = "INSERT INTO graphdesrequests (name, phone, description)
          VALUES ('$name', '$phone', '$description')";
$insert = mysqli_query($con, $query);

if ($insert) {
    $sourceId = (int) mysqli_insert_id($con);
    uln_notify_lead('graphdes', [
        'source_id' => $sourceId,
        'name' => $name,
        'phone' => $phone,
        'description' => $description,
    ]);
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => "$name, your graphics design inquiry has been sent. Thank you!"]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Something went wrong. Please try again later.']);
}

mysqli_close($con);
ob_end_flush();
exit;
?>
