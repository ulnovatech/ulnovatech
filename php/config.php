<?php
$env = ($_SERVER['HTTP_HOST'] === 'localhost') ? 'local' : 'live';

if ($env === 'local') {
    $db_host = "localhost";
    $db_user = "root";
    $db_pass = "";
    $db_name = "ulnovatech";
    $db_port = 3306;
} else {
    $db_host = "sqlXXX.infinityfree.com"; // use the correct host from your control panel
    $db_user = "your_infinityfree_username";
    $db_pass = "your_infinityfree_password";
    $db_name = "your_infinityfree_dbname";
    $db_port = 3306;
}
