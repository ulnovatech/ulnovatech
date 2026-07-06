<?php
require __DIR__ . '/../vendor/autoload.php';

use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Metric;
use Google\Analytics\Data\V1beta\Dimension;

$credentialsPath = getenv('GA_CREDENTIALS_PATH') ?: 'service-account.json';
$fullCredentialsPath = __DIR__ . '/../' . ltrim($credentialsPath, '/\\');

if (!is_file($fullCredentialsPath)) {
    http_response_code(503);
    echo json_encode(['error' => 'Google Analytics credentials not configured']);
    exit;
}

putenv('GOOGLE_APPLICATION_CREDENTIALS=' . $fullCredentialsPath);
$propertyId = getenv('GA_PROPERTY_ID') ?: '502536992';

try {
    $client = new BetaAnalyticsDataClient();

    $response = $client->runReport([
        'property' => 'properties/' . $propertyId,
        'dateRanges' => [new DateRange(['start_date' => '30daysAgo', 'end_date' => 'today'])],
        'metrics' => [
            new Metric(['name' => 'activeUsers']),
            new Metric(['name' => 'newUsers']),
            new Metric(['name' => 'sessions']),
            new Metric(['name' => 'screenPageViews']),
            new Metric(['name' => 'averageSessionDuration']),
            new Metric(['name' => 'engagedSessions']),
            new Metric(['name' => 'bounceRate']),
        ],
        'dimensions' => [
            new Dimension(['name' => 'date']),
        ],
    ]);

    $rows = [];
    foreach ($response->getRows() as $row) {
        $rows[] = [
            'date' => $row->getDimensionValues()[0]->getValue(),
            'activeUsers' => $row->getMetricValues()[0]->getValue(),
            'newUsers' => $row->getMetricValues()[1]->getValue(),
            'sessions' => $row->getMetricValues()[2]->getValue(),
            'pageViews' => $row->getMetricValues()[3]->getValue(),
            'averageSessionDuration' => $row->getMetricValues()[4]->getValue(),
            'engagedSessions' => $row->getMetricValues()[5]->getValue(),
            'bounceRate' => $row->getMetricValues()[6]->getValue(),
        ];
    }

    echo json_encode($rows);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => getenv('APP_DEBUG') === 'true' ? $e->getMessage() : 'Failed to load analytics data',
    ]);
}
