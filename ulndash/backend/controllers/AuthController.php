<?php

require_once __DIR__ . '/../auth/SessionAuth.php';
require_once __DIR__ . '/../auth/MobileTokenAuth.php';

class AuthController
{
    public function __construct(
        private SessionAuth $auth,
        private MobileTokenAuth $mobileAuth,
    ) {
    }

    public function login(): void
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid request body']);
            return;
        }

        $username = trim($data['username'] ?? '');
        $password = (string) ($data['password'] ?? '');

        if ($username === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Username and password are required.']);
            return;
        }

        if (!$this->auth->login($username, $password)) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials.']);
            return;
        }

        echo json_encode([
            'success' => true,
            'user' => $this->auth->user(),
        ]);
    }

    public function logout(): void
    {
        $this->auth->logout();
        echo json_encode(['success' => true]);
    }

    public function me(): void
    {
        $user = $this->auth->user();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            return;
        }
        echo json_encode(['user' => $user]);
    }

    public function mobileLogin(): void
    {
        require_once __DIR__ . '/../../../php/leads/rate_limit.php';
        uln_rate_limit('mobile_admin_login', 10, 3600);

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid request body']);
            return;
        }

        $username = trim($data['username'] ?? '');
        $password = (string) ($data['password'] ?? '');

        if ($username === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Username and password are required.']);
            return;
        }

        if (!$this->mobileAuth->validateCredentials($username, $password)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid credentials.']);
            return;
        }

        try {
            $token = $this->mobileAuth->issueToken($username);
        } catch (RuntimeException $e) {
            http_response_code(503);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            return;
        }

        echo json_encode([
            'success' => true,
            'user' => [
                'username' => $username,
                'auth_via' => 'mobile_token',
            ],
            'token' => $token['token'],
            'expires_at' => $token['expires_at'],
            'expires_in' => $token['expires_in'],
        ]);
    }

    public function mobileMe(): void
    {
        if (!$this->mobileAuth->authenticateRequest()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            return;
        }

        echo json_encode([
            'success' => true,
            'user' => $this->mobileAuth->user(),
        ]);
    }

    public function mobileLogout(): void
    {
        // Stateless JWT — client discards token. Endpoint exists for symmetry.
        echo json_encode(['success' => true, 'message' => 'Signed out. Discard the token on the device.']);
    }
}
