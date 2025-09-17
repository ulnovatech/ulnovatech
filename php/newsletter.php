<?php
ob_start(); // Start output buffering to capture any unintended output
header('Content-Type: application/json; charset=UTF-8');

// Load database config
require_once(__DIR__ . '/config.php');

// Connect to database
$con = mysqli_connect($db_host, $db_user, $db_pass, $db_name, $db_port);
if (!$con) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to database.']);
    ob_end_flush();
    exit;
}

// Sanitize inputs
$email   = mysqli_real_escape_string($con, $_POST['email'] ?? '');

// Validate required fields
if (empty($email)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'This field is required.']);
    ob_end_flush();
    exit;
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
    ob_end_flush();
    exit;
}

// Insert data
$query = "INSERT INTO newsletter (email)
          VALUES ('$email')";
$insert = mysqli_query($con, $query);

if ($insert) {
    http_response_code(200);
    echo json_encode(['status' => 'success', 'message' => "Thanks so much for reaching out! We’ve received your message and will be in touch very soon."]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Something went wrong. Please try again later.']);
}

mysqli_close($con);
ob_end_flush();
exit;
?>
