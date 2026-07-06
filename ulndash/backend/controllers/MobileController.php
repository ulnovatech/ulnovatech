<?php

class MobileController
{
    private PDO $pdo;

    /** @var array<string, array{table: string, submitted_at: string}> */
    private array $sources;

    public function __construct(PDO $pdo, array $requestSources)
    {
        $this->pdo = $pdo;
        $this->sources = [];
        foreach ($requestSources as $type => $meta) {
            $this->sources[$type] = [
                'table' => $meta['table'],
                'submitted_at' => $meta['submitted_at'],
            ];
        }
    }

    public function summary(): array
    {
        $byType24h = [];
        $byType7d = [];
        $total24h = 0;
        $total7d = 0;

        foreach ($this->sources as $type => $meta) {
            $count24 = $this->countSince($meta['table'], $meta['submitted_at'], 24);
            $count7 = $this->countSince($meta['table'], $meta['submitted_at'], 24 * 7);
            $byType24h[$type] = $count24;
            $byType7d[$type] = $count7;
            $total24h += $count24;
            $total7d += $count7;
        }

        return [
            'success' => true,
            'generated_at' => gmdate('c'),
            'totals' => [
                'last_24h' => $total24h,
                'last_7d' => $total7d,
            ],
            'by_type' => [
                'last_24h' => $byType24h,
                'last_7d' => $byType7d,
            ],
            'payments' => [
                'pending_deposits' => $this->countPendingPayments(),
                'successful_deposits_24h' => $this->countPaymentsSince(24, 'successful'),
            ],
            'highlights' => [
                'website_orders_24h' => $byType24h['website_order'] ?? 0,
                'contact_24h' => $byType24h['contactus'] ?? 0,
                'service_inquiries_24h' => ($byType24h['appdev'] ?? 0)
                    + ($byType24h['graphdes'] ?? 0)
                    + ($byType24h['marketing'] ?? 0)
                    + ($byType24h['webdesign'] ?? 0),
            ],
        ];
    }

    private function countSince(string $table, string $submittedCol, int $hours): int
    {
        $sql = "SELECT COUNT(*) FROM `{$table}`
                WHERE `{$submittedCol}` >= DATE_SUB(NOW(), INTERVAL :hours HOUR)";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':hours', $hours, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    private function countPendingPayments(): int
    {
        if (!$this->tableExists('order_payments')) {
            return 0;
        }

        $stmt = $this->pdo->query("SELECT COUNT(*) FROM order_payments WHERE status = 'pending'");

        return (int) $stmt->fetchColumn();
    }

    private function countPaymentsSince(int $hours, string $status): int
    {
        if (!$this->tableExists('order_payments')) {
            return 0;
        }

        $stmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM order_payments
             WHERE status = :status
               AND COALESCE(paid_at, created_at) >= DATE_SUB(NOW(), INTERVAL :hours HOUR)"
        );
        $stmt->execute([
            ':status' => $status,
            ':hours' => $hours,
        ]);

        return (int) $stmt->fetchColumn();
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

    public function registerDevice(array $data, ?array $user): array
    {
        if (!$user || empty($user['username'])) {
            throw new RuntimeException('Unauthorized', 401);
        }

        if (!$this->tableExists('admin_devices')) {
            throw new RuntimeException('Push devices table is not installed. Run apply_admin_devices.php', 503);
        }

        $fcmToken = trim((string) ($data['fcm_token'] ?? ''));
        if ($fcmToken === '') {
            throw new InvalidArgumentException('fcm_token is required');
        }

        $platform = trim((string) ($data['platform'] ?? 'android'));
        if ($platform === '') {
            $platform = 'android';
        }

        $deviceLabel = trim((string) ($data['device_label'] ?? ''));
        $alertsEnabled = array_key_exists('alerts_enabled', $data)
            ? ((bool) $data['alerts_enabled'] ? 1 : 0)
            : 1;

        $stmt = $this->pdo->prepare(
            'INSERT INTO admin_devices
             (admin_username, fcm_token, platform, device_label, alerts_enabled, last_seen_at)
             VALUES (:username, :token, :platform, :label, :alerts, NOW())
             ON DUPLICATE KEY UPDATE
               admin_username = VALUES(admin_username),
               platform = VALUES(platform),
               device_label = COALESCE(VALUES(device_label), device_label),
               alerts_enabled = VALUES(alerts_enabled),
               last_seen_at = NOW()'
        );
        $stmt->execute([
            ':username' => $user['username'],
            ':token' => $fcmToken,
            ':platform' => substr($platform, 0, 32),
            ':label' => $deviceLabel !== '' ? substr($deviceLabel, 0, 120) : null,
            ':alerts' => $alertsEnabled,
        ]);

        return [
            'success' => true,
            'alerts_enabled' => (bool) $alertsEnabled,
            'registered' => true,
        ];
    }

    public function deviceStatus(string $fcmToken, ?array $user): array
    {
        if (!$user || empty($user['username'])) {
            throw new RuntimeException('Unauthorized', 401);
        }

        if (!$this->tableExists('admin_devices')) {
            return [
                'success' => true,
                'registered' => false,
                'alerts_enabled' => true,
            ];
        }

        $fcmToken = trim($fcmToken);
        if ($fcmToken === '') {
            throw new InvalidArgumentException('fcm_token is required');
        }

        $stmt = $this->pdo->prepare(
            'SELECT alerts_enabled FROM admin_devices
             WHERE fcm_token = :token AND admin_username = :username
             LIMIT 1'
        );
        $stmt->execute([
            ':token' => $fcmToken,
            ':username' => $user['username'],
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return [
                'success' => true,
                'registered' => false,
                'alerts_enabled' => true,
            ];
        }

        return [
            'success' => true,
            'registered' => true,
            'alerts_enabled' => (bool) $row['alerts_enabled'],
        ];
    }

    public function updateDeviceAlerts(array $data, ?array $user): array
    {
        if (!$user || empty($user['username'])) {
            throw new RuntimeException('Unauthorized', 401);
        }

        if (!$this->tableExists('admin_devices')) {
            throw new RuntimeException('Push devices table is not installed', 503);
        }

        $fcmToken = trim((string) ($data['fcm_token'] ?? ''));
        if ($fcmToken === '') {
            throw new InvalidArgumentException('fcm_token is required');
        }

        if (!array_key_exists('alerts_enabled', $data)) {
            throw new InvalidArgumentException('alerts_enabled is required');
        }

        $alertsEnabled = (bool) $data['alerts_enabled'] ? 1 : 0;

        $stmt = $this->pdo->prepare(
            'UPDATE admin_devices
             SET alerts_enabled = :alerts, last_seen_at = NOW()
             WHERE fcm_token = :token AND admin_username = :username'
        );
        $stmt->execute([
            ':alerts' => $alertsEnabled,
            ':token' => $fcmToken,
            ':username' => $user['username'],
        ]);

        return [
            'success' => true,
            'alerts_enabled' => (bool) $alertsEnabled,
            'updated' => $stmt->rowCount() > 0,
        ];
    }

    public function unregisterDevice(array $data, ?array $user): array
    {
        if (!$user || empty($user['username'])) {
            throw new RuntimeException('Unauthorized', 401);
        }

        if (!$this->tableExists('admin_devices')) {
            return ['success' => true, 'removed' => false];
        }

        $fcmToken = trim((string) ($data['fcm_token'] ?? ''));
        if ($fcmToken === '') {
            throw new InvalidArgumentException('fcm_token is required');
        }

        $stmt = $this->pdo->prepare(
            'DELETE FROM admin_devices WHERE fcm_token = :token AND admin_username = :username'
        );
        $stmt->execute([
            ':token' => $fcmToken,
            ':username' => $user['username'],
        ]);

        return [
            'success' => true,
            'removed' => $stmt->rowCount() > 0,
        ];
    }
}
