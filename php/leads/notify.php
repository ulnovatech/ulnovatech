<?php
/**
 * Lightweight lead notification helper.
 * Phase 1: error_log + mail(). Phase 2 can add Slack/webhook.
 */
function uln_notify_lead(string $type, array $payload): void
{
    $to = getenv('LEAD_NOTIFY_EMAIL') ?: 'ulnovatech@gmail.com';
    $subject = '[UlnovaTech] New lead: ' . $type;

    $lines = [
        'Type: ' . $type,
        'Time: ' . date('c'),
    ];

    foreach ($payload as $key => $value) {
        if ($value === null || $value === '') {
            continue;
        }
        $label = ucwords(str_replace('_', ' ', (string) $key));
        $lines[] = $label . ': ' . $value;
    }

    $message = implode("\n", $lines);
    error_log($message);

    $headers = 'From: noreply@ulnovatech.store' . "\r\n" .
        'Content-Type: text/plain; charset=UTF-8';

    @mail($to, $subject, $message, $headers);

    if (!function_exists('uln_dispatch_lead_push')) {
        require_once __DIR__ . '/push_notify.php';
    }
    uln_dispatch_lead_push($type, $payload);
}
