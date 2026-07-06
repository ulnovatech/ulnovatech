<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Google\Auth\Credentials\ServiceAccountCredentials;

class PushNotificationService
{
    private const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function isConfigured(): bool
    {
        return $this->projectId() !== '' && is_file($this->credentialsPath());
    }

    public function sendLeadAlert(string $type, array $payload): array
    {
        if (!$this->isConfigured() || !$this->tableExists('admin_devices')) {
            return ['sent' => 0, 'skipped' => 'not_configured'];
        }

        $tokens = $this->activeTokens();
        if ($tokens === []) {
            return ['sent' => 0, 'skipped' => 'no_devices'];
        }

        $title = $this->buildTitle($type);
        $body = $this->buildBody($type, $payload);
        $data = [
            'request_type' => $type,
            'source_id' => (string) ($payload['source_id'] ?? ''),
        ];

        $sent = 0;
        $failed = 0;
        $removed = 0;

        foreach ($tokens as $row) {
            $result = $this->sendToToken($row['fcm_token'], $title, $body, $data);
            if ($result['ok']) {
                $sent++;
                continue;
            }

            $failed++;
            if ($result['remove_token']) {
                $this->removeToken($row['fcm_token']);
                $removed++;
            }
        }

        return [
            'sent' => $sent,
            'failed' => $failed,
            'removed' => $removed,
        ];
    }

    /** @return list<array{fcm_token: string}> */
    private function activeTokens(): array
    {
        $stmt = $this->pdo->query(
            'SELECT fcm_token FROM admin_devices WHERE alerts_enabled = 1 ORDER BY updated_at DESC'
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    /** @return array{ok: bool, remove_token?: bool, error?: string} */
    private function sendToToken(string $token, string $title, string $body, array $data): array
    {
        $accessToken = $this->accessToken();
        if ($accessToken === '') {
            return ['ok' => false, 'error' => 'no_access_token'];
        }

        $url = sprintf(
            'https://fcm.googleapis.com/v1/projects/%s/messages:send',
            rawurlencode($this->projectId())
        );

        $payload = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => array_map('strval', $data),
                'android' => [
                    'priority' => 'HIGH',
                ],
            ],
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json; charset=UTF-8',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 15,
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            error_log('FCM curl error: ' . $curlError);
            return ['ok' => false, 'error' => $curlError];
        }

        if ($status >= 200 && $status < 300) {
            return ['ok' => true];
        }

        $decoded = json_decode($response, true);
        $message = $decoded['error']['message'] ?? $response;
        error_log('FCM send failed (' . $status . '): ' . $message);

        $remove = $status === 404
            || str_contains(strtolower((string) $message), 'not found')
            || str_contains(strtolower((string) $message), 'unregistered');

        return [
            'ok' => false,
            'error' => (string) $message,
            'remove_token' => $remove,
        ];
    }

    private function accessToken(): string
    {
        static $cached = null;
        static $expiresAt = 0;

        if (is_string($cached) && $expiresAt > time() + 30) {
            return $cached;
        }

        $credentials = new ServiceAccountCredentials(
            [self::FCM_SCOPE],
            $this->credentialsPath()
        );
        $token = $credentials->fetchAuthToken();

        $cached = (string) ($token['access_token'] ?? '');
        $expiresAt = time() + (int) ($token['expires_in'] ?? 3000);

        return $cached;
    }

    private function projectId(): string
    {
        return trim((string) (getenv('FCM_PROJECT_ID') ?: getenv('FIREBASE_PROJECT_ID') ?: ''));
    }

    private function credentialsPath(): string
    {
        $relative = getenv('FCM_CREDENTIALS_PATH') ?: getenv('GA_CREDENTIALS_PATH') ?: 'service-account.json';

        return __DIR__ . '/../' . ltrim($relative, '/\\');
    }

    private function buildTitle(string $type): string
    {
        $map = [
            'website_order' => 'New website order',
            'contactus' => 'New contact form',
            'appdev' => 'New app dev inquiry',
            'graphdes' => 'New graphic design inquiry',
            'marketing' => 'New marketing inquiry',
            'webdesign' => 'New web design inquiry',
            'newsletter' => 'New newsletter signup',
        ];

        return $map[$type] ?? 'New lead: ' . $type;
    }

    private function buildBody(string $type, array $payload): string
    {
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name !== '') {
            return $name;
        }

        $email = trim((string) ($payload['email'] ?? ''));
        if ($email !== '') {
            return $email;
        }

        $template = trim((string) ($payload['template'] ?? ''));
        if ($template !== '') {
            return $template;
        }

        return 'Tap to view details';
    }

    private function removeToken(string $token): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM admin_devices WHERE fcm_token = :token');
        $stmt->execute([':token' => $token]);
    }

    private function tableExists(string $table): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = :table'
        );
        $stmt->execute([':table' => $table]);

        return (int) $stmt->fetchColumn() > 0;
    }
}
