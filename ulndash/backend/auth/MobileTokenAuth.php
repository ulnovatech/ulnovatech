<?php

/**
 * HS256 JWT for admin mobile app (no extra Composer deps).
 */
class MobileTokenAuth
{
    private const TTL_SECONDS = 604800; // 7 days

    private ?array $resolvedUser = null;

    public function user(): ?array
    {
        return $this->resolvedUser;
    }

    public function authenticateRequest(): bool
    {
        $this->resolvedUser = null;
        $token = $this->extractBearerToken();
        if ($token === null) {
            return false;
        }

        $payload = $this->decode($token);
        if ($payload === null || empty($payload['sub'])) {
            return false;
        }

        $this->resolvedUser = [
            'username' => (string) $payload['sub'],
            'auth_via' => 'mobile_token',
            'logged_in_at' => isset($payload['iat']) ? gmdate('c', (int) $payload['iat']) : null,
        ];

        return true;
    }

    public function issueToken(string $username): array
    {
        $now = time();
        $payload = [
            'sub' => $username,
            'iat' => $now,
            'exp' => $now + self::TTL_SECONDS,
        ];

        return [
            'token' => $this->encode($payload),
            'expires_at' => gmdate('c', $payload['exp']),
            'expires_in' => self::TTL_SECONDS,
        ];
    }

    public function validateCredentials(string $username, string $password): bool
    {
        $expectedUser = getenv('DASH_ADMIN_USER') ?: 'admin';
        $passHash = getenv('DASH_ADMIN_PASS_HASH') ?: '';
        $passPlain = getenv('DASH_ADMIN_PASS') ?: '';

        if ($username !== $expectedUser) {
            return false;
        }

        if ($passHash !== '') {
            return password_verify($password, $passHash);
        }

        if ($passPlain !== '') {
            return hash_equals($passPlain, $password);
        }

        return false;
    }

    private function extractBearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if ($header === '' && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (!preg_match('/^Bearer\s+(\S+)$/i', trim($header), $matches)) {
            return null;
        }

        return $matches[1];
    }

    private function secret(): string
    {
        $secret = getenv('MOBILE_JWT_SECRET') ?: '';
        if ($secret !== '') {
            return $secret;
        }

        if (getenv('APP_DEBUG') === 'true') {
            return 'ulnovatech-mobile-dev-secret-change-me';
        }

        throw new RuntimeException('MOBILE_JWT_SECRET is not configured.');
    }

    private function encode(array $payload): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [
            $this->base64UrlEncode(json_encode($header)),
            $this->base64UrlEncode(json_encode($payload)),
        ];
        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, $this->secret(), true);
        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    private function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;
        $signingInput = $headerB64 . '.' . $payloadB64;
        $expected = $this->base64UrlEncode(hash_hmac('sha256', $signingInput, $this->secret(), true));

        if (!hash_equals($expected, $signatureB64)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($payloadB64), true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null;
        }

        return $payload;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder > 0) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        return (string) base64_decode(strtr($data, '-_', '+/'), true);
    }
}
