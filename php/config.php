<?php
// =====================================
// CONFIG INDEX
// 1. Environment Detection
// 2. Base URL
// 3. Database Settings
// 4. Database Connection
// 5. Debug Settings
// =====================================

// 1️⃣ Environment Detection
$ENV = getenv('BASE_URL') ? 'production' : (isset($_SERVER['HTTP_HOST']) && $_SERVER['HTTP_HOST'] === 'localhost' ? 'local' : 'production');

// 2️⃣ Base URL
$BASE_URL = getenv('BASE_URL') ?: ($ENV === 'local' ? 'http://localhost/ulnovatech' : 'https://ulnovatech.store');

// 3️⃣ Database Settings
$DB = [
    'host' => getenv('DB_HOST') ?: ($ENV === 'local' ? 'localhost' : 'sql100.infinityfree.com'),
    'user' => getenv('DB_USER') ?: ($ENV === 'local' ? 'root' : 'if0_39543881'),
    'pass' => getenv('DB_PASS') ?: ($ENV === 'local' ? '' : '7MSoA5Mf92YxCF'),
    'name' => getenv('DB_NAME') ?: ($ENV === 'local' ? 'ulnovatech' : 'if0_39543881_ulnovatech'),
    // 'port' => getenv('DB_PORT') ?: 3306
];

// 4️⃣ Database Connection
$conn = new mysqli($DB['host'], $DB['user'], $DB['pass'], $DB['name'], $DB['port']);
if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

// 5️⃣ Debug Settings (only local)
if ($ENV === 'local') {
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
}
