<?php

require_once __DIR__ . '/SessionAuth.php';
require_once __DIR__ . '/MobileTokenAuth.php';

/**
 * Unified gate: session cookie (web dash) or Bearer JWT (mobile app).
 */
class ApiAuth
{
    public function __construct(
        private SessionAuth $session,
        private MobileTokenAuth $mobile,
    ) {
    }

    public function user(): ?array
    {
        if ($this->mobile->authenticateRequest()) {
            return $this->mobile->user();
        }

        return $this->session->user();
    }

    public function requireAuth(): void
    {
        if ($this->user() !== null) {
            return;
        }

        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => 'Please sign in to continue.',
        ]);
        exit;
    }
}
