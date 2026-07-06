<?php

require_once __DIR__ . '/../env.php';

function uln_flutterwave_config(): array
{
    $baseUrl = getenv('BASE_URL') ?: 'https://ulnovatech.store';
    $defaultRedirect = rtrim($baseUrl, '/') . '/portfolio-app/order/success';

    return [
        'public_key' => getenv('FLUTTERWAVE_PUBLIC_KEY') ?: '',
        'secret_key' => getenv('FLUTTERWAVE_SECRET_KEY') ?: '',
        'secret_hash' => getenv('FLUTTERWAVE_SECRET_HASH') ?: '',
        'redirect_url' => getenv('FLUTTERWAVE_REDIRECT_URL') ?: $defaultRedirect,
        'logo_url' => getenv('FLUTTERWAVE_LOGO_URL') ?: rtrim($baseUrl, '/') . '/assets/img/uln-logo.png',
    ];
}

function uln_flutterwave_is_configured(): bool
{
    $cfg = uln_flutterwave_config();

    return $cfg['secret_key'] !== '' && $cfg['public_key'] !== '';
}

function uln_flutterwave_request(string $method, string $path, ?array $body = null): array
{
    $cfg = uln_flutterwave_config();
    if ($cfg['secret_key'] === '') {
        throw new RuntimeException('Flutterwave secret key is not configured.');
    }

    $url = 'https://api.flutterwave.com/v3' . $path;
    $ch = curl_init($url);

    $headers = [
        'Authorization: Bearer ' . $cfg['secret_key'],
        'Content-Type: application/json',
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno) {
        throw new RuntimeException('Flutterwave request failed: ' . $error);
    }

    $decoded = json_decode((string) $raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Invalid Flutterwave response.');
    }

    if ($status < 200 || $status >= 300) {
        $message = $decoded['message'] ?? 'Flutterwave API error';
        throw new RuntimeException($message);
    }

    return $decoded;
}

function uln_flutterwave_initialize_payment(array $payload): array
{
    $response = uln_flutterwave_request('POST', '/payments', $payload);
    if (($response['status'] ?? '') !== 'success') {
        throw new RuntimeException($response['message'] ?? 'Could not initialize payment.');
    }

    return $response['data'] ?? [];
}

function uln_flutterwave_verify_by_reference(string $txRef): array
{
    $response = uln_flutterwave_request(
        'GET',
        '/transactions/verify_by_reference?tx_ref=' . rawurlencode($txRef)
    );

    if (($response['status'] ?? '') !== 'success') {
        throw new RuntimeException($response['message'] ?? 'Could not verify payment.');
    }

    return $response['data'] ?? [];
}

function uln_flutterwave_verify_webhook(): array
{
    $cfg = uln_flutterwave_config();
    $signature = $_SERVER['HTTP_VERIF_HASH'] ?? '';

    if ($cfg['secret_hash'] !== '' && !hash_equals($cfg['secret_hash'], $signature)) {
        throw new RuntimeException('Invalid webhook signature.');
    }

    $payload = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($payload)) {
        throw new RuntimeException('Invalid webhook payload.');
    }

    return $payload;
}

function uln_flutterwave_generate_tx_ref(): string
{
    return 'ULN-' . gmdate('YmdHis') . '-' . bin2hex(random_bytes(4));
}

function uln_flutterwave_payment_is_successful(array $transaction): bool
{
    $status = strtolower((string) ($transaction['status'] ?? ''));

    return in_array($status, ['successful', 'success'], true);
}
