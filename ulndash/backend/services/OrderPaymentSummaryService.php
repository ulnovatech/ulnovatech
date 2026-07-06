<?php

/**
 * Read-only payment summary for admin mobile (no customer phone challenge).
 */
class OrderPaymentSummaryService
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function forWebsiteOrder(array $request): ?array
    {
        if (!$this->tableExists('order_payments')) {
            return null;
        }

        $description = (string) ($request['description'] ?? '');
        $raw = is_array($request['raw'] ?? null) ? $request['raw'] : [];
        $template = trim((string) ($raw['template'] ?? ''));
        $phone = trim((string) ($request['phone'] ?? ''));

        $txRef = $this->extractPaymentRef($description);
        $payment = null;

        if ($txRef !== '') {
            $payment = $this->findByTxRef($txRef);
        }

        if (!$payment && $template !== '' && $phone !== '') {
            $payment = $this->findLatestByTemplatePhone($template, $phone);
        }

        if (!$payment) {
            return null;
        }

        return $this->formatSummary($payment);
    }

    public function byTxRef(string $txRef): ?array
    {
        if ($txRef === '' || !$this->tableExists('order_payments')) {
            return null;
        }

        $payment = $this->findByTxRef($txRef);

        return $payment ? $this->formatSummary($payment) : null;
    }

    private function findByTxRef(string $txRef): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM order_payments WHERE tx_ref = ? LIMIT 1');
        $stmt->execute([$txRef]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function findLatestByTemplatePhone(string $template, string $phone): ?array
    {
        $digits = preg_replace('/\D+/', '', $phone);
        $stmt = $this->pdo->prepare(
            'SELECT * FROM order_payments
             WHERE template_key = ?
               AND (
                 customer_phone = ?
                 OR REPLACE(REPLACE(customer_phone, " ", ""), "+", "") LIKE ?
                 OR REPLACE(CONCAT(country_code, customer_phone), " ", "") LIKE ?
               )
             ORDER BY created_at DESC
             LIMIT 1'
        );
        $like = '%' . substr($digits, -9);
        $stmt->execute([$template, $phone, $like, $like]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function formatSummary(array $payment): array
    {
        $packages = $this->packages();
        $packageId = (string) ($payment['package'] ?? 'basic');
        $packageMeta = $packages[$packageId] ?? [
            'title' => ucfirst($packageId),
            'price_ugx' => 0,
        ];

        $status = (string) ($payment['status'] ?? 'pending');
        $templateReserved = false;

        if ($status === 'successful') {
            $stmt = $this->pdo->prepare(
                "SELECT status FROM templates
                 WHERE (name = ? OR folder_name = ?)
                   AND status IN ('reserved', 'taken')
                 LIMIT 1"
            );
            $stmt->execute([$payment['template_key'], $payment['template_key']]);
            $templateReserved = (bool) $stmt->fetch();
        }

        $labels = [
            'pending' => 'Awaiting payment',
            'successful' => 'Deposit confirmed',
            'failed' => 'Payment failed',
            'cancelled' => 'Payment cancelled',
        ];

        return [
            'tx_ref' => $payment['tx_ref'],
            'status' => $status,
            'status_label' => $labels[$status] ?? ucfirst($status),
            'template' => $payment['template_key'],
            'package' => $packageId,
            'package_title' => $packageMeta['title'],
            'customer_name' => $payment['customer_name'],
            'customer_email' => $payment['customer_email'],
            'deposit_label' => $this->formatUgx((int) $payment['amount_ugx']),
            'package_total_label' => (int) ($packageMeta['price_ugx'] ?? 0) > 0
                ? $this->formatUgx((int) $packageMeta['price_ugx'])
                : null,
            'template_reserved' => $templateReserved,
            'created_at' => $payment['created_at'],
            'paid_at' => $payment['paid_at'],
        ];
    }

    private function extractPaymentRef(string $description): string
    {
        foreach (preg_split('/\R/', $description) as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            if (preg_match('/^(payment\s*ref|tx_ref|reference)\s*:\s*(.+)$/i', $line, $m)) {
                return trim($m[2]);
            }
        }

        return '';
    }

    /** @return array<string, array{title: string, price_ugx: int}> */
    private function packages(): array
    {
        $file = dirname(__DIR__, 3) . '/php/payments/packages.php';
        if (!is_file($file)) {
            return [];
        }

        require_once $file;

        if (function_exists('uln_packages')) {
            return uln_packages();
        }

        return [];
    }

    private function formatUgx(int $amount): string
    {
        $file = dirname(__DIR__, 3) . '/php/payments/packages.php';
        if (is_file($file)) {
            require_once $file;
            if (function_exists('uln_format_ugx')) {
                return uln_format_ugx($amount);
            }
        }

        return 'UGX ' . number_format($amount);
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
