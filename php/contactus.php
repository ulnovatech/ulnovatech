<?php
ob_start();
header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/leads/notify.php';
require_once __DIR__ . '/leads/rate_limit.php';

uln_rate_limit('contactus');

$con = mysqli_connect($db_host, $db_user, $db_pass, $db_name, $db_port);
if (!$con) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to connect to database.']);
    ob_end_flush();
    exit;
}

$name    = trim($_POST['name'] ?? '');
$phone   = trim($_POST['phone'] ?? '');
$email   = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $phone === '' || $email === '' || $subject === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
    mysqli_close($con);
    ob_end_flush();
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
    mysqli_close($con);
    ob_end_flush();
    exit;
}

$stmt = $con->prepare('INSERT INTO contactus (name, phone, email, subject, message) VALUES (?, ?, ?, ?, ?)');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Something went wrong. Please try again later.']);
    mysqli_close($con);
    ob_end_flush();
    exit;
}

$stmt->bind_param('sssss', $name, $phone, $email, $subject, $message);
$insert = $stmt->execute();
$stmt->close();

if ($insert) {
    $sourceId = (int) mysqli_insert_id($con);
    uln_notify_lead('contactus', [
        'source_id' => $sourceId,
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'subject' => $subject,
        'message' => $message,
    ]);
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => "$name, your message has been received. We'll get back to you soon. Thank you!",
    ]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Something went wrong. Please try again later.']);
}

mysqli_close($con);
ob_end_flush();
exit;
