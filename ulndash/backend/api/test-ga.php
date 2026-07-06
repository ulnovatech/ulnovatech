<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require __DIR__ . '/../vendor/autoload.php';

var_dump(file_exists(__DIR__ . '/../vendor/autoload.php')); // should print true

use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;

try {
    $client = new BetaAnalyticsDataClient();
    echo "GA4 client works!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
