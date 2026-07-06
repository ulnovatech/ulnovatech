<?php

class SessionAuth
{
    private const SESSION_KEY = 'ulndash_user';

    public function __construct()
    {
        if (session_status() === PHP_SESSION_NONE) {
            $secure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
            session_set_cookie_params([
                'lifetime' => 86400,
                'path' => '/',
                'secure' => $secure,
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
            session_start();
        }
    }

    public function user(): ?array
    {
        return $_SESSION[self::SESSION_KEY] ?? null;
    }

    public function check(): bool
    {
        return $this->user() !== null;
    }

    public function login(string $username, string $password): bool
    {
        $expectedUser = getenv('DASH_ADMIN_USER') ?: 'admin';
        $passHash = getenv('DASH_ADMIN_PASS_HASH') ?: '';
        $passPlain = getenv('DASH_ADMIN_PASS') ?: '';

        if ($username !== $expectedUser) {
            return false;
        }

        $valid = false;
        if ($passHash !== '') {
            $valid = password_verify($password, $passHash);
        } elseif ($passPlain !== '') {
            $valid = hash_equals($passPlain, $password);
        }

        if (!$valid) {
            return false;
        }

        session_regenerate_id(true);
        $_SESSION[self::SESSION_KEY] = [
            'username' => $username,
            'logged_in_at' => date('c'),
        ];
        return true;
    }

    public function logout(): void
    {
        unset($_SESSION[self::SESSION_KEY]);
        session_regenerate_id(true);
    }

    public function requireAuth(): void
    {
        if (!$this->check()) {
            http_response_code(401);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['error' => 'Unauthorized', 'message' => 'Please sign in to continue.']);
            exit;
        }
    }
}
