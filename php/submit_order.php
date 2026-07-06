<?php
ob_start(); // Start output buffering to capture any unintended output
header('Content-Type: application/json; charset=UTF-8');

// Database connection settings
require_once(__DIR__ . '/config.php');

// Create connection using variables from config
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name, $db_port);

// Check for connection error
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Sanitize input data
$template = isset($_POST['template']) ? trim($_POST['template']) : '';
$name     = isset($_POST['name']) ? trim($_POST['name']) : '';
$phone    = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$business = isset($_POST['business']) ? trim($_POST['business']) : '';
$details  = isset($_POST['details']) ? trim($_POST['details']) : '';

// Basic validation
if (empty($name) || empty($phone)) {
    die("Name and Phone are required.");
}

// Prepare and bind
$stmt = $conn->prepare("INSERT INTO website_orders (template, name, phone, business, details) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $template, $name, $phone, $business, $details);

// Execute the statement
if ($stmt->execute()) {
    echo "Order submitted successfully!";
} else {
    echo "Error: " . $stmt->error;
}

// Close connections
$stmt->close();
$conn->close();
?>
