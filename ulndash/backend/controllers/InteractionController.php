<?php
// controllers/InteractionController.php
class InteractionController {
    private $pdo;
    public function __construct($pdo) { $this->pdo = $pdo; }

    public function index($companyId) {
        $stmt = $this->pdo->prepare('SELECT * FROM interactions WHERE company_id = :id ORDER BY happened_at DESC');
        $stmt->execute([':id' => $companyId]);
        respond(['data' => $stmt->fetchAll()]);
    }

    public function create($body) {
        $sql = 'INSERT INTO interactions (company_id, channel, outcome, notes, happened_at) VALUES (:company_id, :channel, :outcome, :notes, :happened_at)';
        $stmt = $this->pdo->prepare($sql);
        $params = [
            ':company_id' => $body['company_id'],
            ':channel' => $body['channel'] ?? 'whatsapp',
            ':outcome' => $body['outcome'] ?? 'no_reply',
            ':notes' => $body['notes'] ?? null,
            ':happened_at' => $body['happened_at'] ?? date('Y-m-d H:i:s'),
        ];
        $stmt->execute($params);

        // update company's last_contact_date if this interaction is recent
        $this->pdo->prepare('UPDATE companies SET last_contact_date = :d WHERE id = :id')->execute([
            ':d' => date('Y-m-d'),
            ':id' => $body['company_id']
        ]);

        respond(['id' => (int)$this->pdo->lastInsertId()], 201);
    }
}
