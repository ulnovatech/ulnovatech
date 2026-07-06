<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['email']) || empty($input['name']) || empty($input['service'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Process the form data
$to = 'ulnovatech@gmail.com';
$subject = 'New Developer Quote Request - ' . $input['name'];
$headers = [
    'From: ' . $input['name'] . ' <' . $input['email'] . '>',
    'Reply-To: ' . $input['email'],
    'Content-Type: text/html; charset=UTF-8'
];

$message = '
<html>
<body>
    <h2>New Developer Quote Request</h2>
    <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . htmlspecialchars($input['name']) . '</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . htmlspecialchars($input['email']) . '</td></tr>
';

if (!empty($input['company'])) {
    $message .= '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Company:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . htmlspecialchars($input['company']) . '</td></tr>';
}

$message .= '
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Service:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . htmlspecialchars($input['service']) . '</td></tr>
';

if (!empty($input['budget'])) {
    $message .= '<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Budget:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . htmlspecialchars($input['budget']) . '</td></tr>';
}

$message .= '
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Timeline:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . htmlspecialchars($input['timeline']) . '</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Message:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">' . nl2br(htmlspecialchars($input['message'])) . '</td></tr>
    </table>
    <p><em>Received: ' . date('Y-m-d H:i:s') . '</em></p>
</body>
</html>';

if (mail($to, $subject, $message, $headers)) {
    echo json_encode(['message' => 'Quote request sent successfully']);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to send email']);
}
?>