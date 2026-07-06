<?php

class ProspectsController
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    private static $allowedStatus = ['not_contacted', 'contacted', 'qualified', 'converted_to_company'];
    private static $allowedPriority = ['high', 'medium', 'low'];

    public function index($query = [])
    {
        $pdo = $this->pdo;
        $sql = 'SELECT * FROM prospects WHERE 1=1';
        $params = [];

        if (!empty($query['q'])) {
            $sql .= ' AND (name LIKE :q OR notes LIKE :q2 OR industry LIKE :q3 OR source LIKE :q4)';
            $params[':q'] = '%' . $query['q'] . '%';
            $params[':q2'] = '%' . $query['q'] . '%';
            $params[':q3'] = '%' . $query['q'] . '%';
            $params[':q4'] = '%' . $query['q'] . '%';
        }
        if (!empty($query['status'])) {
            $sql .= ' AND status = :status';
            $params[':status'] = $query['status'];
        }
        if (!empty($query['priority'])) {
            $sql .= ' AND priority = :priority';
            $params[':priority'] = $query['priority'];
        }
        if (!empty($query['source'])) {
            $sql .= ' AND source LIKE :source';
            $params[':source'] = '%' . $query['source'] . '%';
        }

        $allowedSort = ['name', 'status', 'priority', 'created_at', 'updated_at', 'contacted_at'];
        $sort = $query['sort'] ?? 'created_at';
        $sort = in_array($sort, $allowedSort) ? $sort : 'created_at';
        $dir = strtoupper($query['dir'] ?? 'DESC');
        $dir = in_array($dir, ['ASC', 'DESC']) ? $dir : 'DESC';
        $sql .= " ORDER BY $sort $dir";

        $page = isset($query['page']) ? max(1, (int)$query['page']) : 1;
        $perPage = isset($query['per_page']) ? max(1, min(200, (int)$query['per_page'])) : 25;
        $offset = ($page - 1) * $perPage;
        $sql .= ' LIMIT :limit OFFSET :offset';

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $countSql = 'SELECT COUNT(*) FROM prospects WHERE 1=1';
        $countParams = [];
        if (!empty($query['q'])) {
            $countSql .= ' AND (name LIKE :q OR notes LIKE :q2 OR industry LIKE :q3 OR source LIKE :q4)';
            $countParams[':q'] = '%' . $query['q'] . '%';
            $countParams[':q2'] = '%' . $query['q'] . '%';
            $countParams[':q3'] = '%' . $query['q'] . '%';
            $countParams[':q4'] = '%' . $query['q'] . '%';
        }
        if (!empty($query['status'])) {
            $countSql .= ' AND status = :status';
            $countParams[':status'] = $query['status'];
        }
        if (!empty($query['priority'])) {
            $countSql .= ' AND priority = :priority';
            $countParams[':priority'] = $query['priority'];
        }
        if (!empty($query['source'])) {
            $countSql .= ' AND source LIKE :source';
            $countParams[':source'] = '%' . $query['source'] . '%';
        }

        $countStmt = $pdo->prepare($countSql);
        foreach ($countParams as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        return [
            'data' => $rows,
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $perPage ? (int)ceil($total / $perPage) : 1,
        ];
    }

    public function show($id)
    {
        $stmt = $this->pdo->prepare('SELECT * FROM prospects WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return ['error' => 'Not found'];
        }
        return $row;
    }

    public function stats()
    {
        $pdo = $this->pdo;
        $total = (int)$pdo->query('SELECT COUNT(*) FROM prospects')->fetchColumn();
        $stmt = $pdo->query('SELECT status, COUNT(*) AS c FROM prospects GROUP BY status');
        $byStatus = [];
        while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $byStatus[$r['status']] = (int)$r['c'];
        }
        $converted = (int)($byStatus['converted_to_company'] ?? 0);
        $qualified = (int)($byStatus['qualified'] ?? 0);
        $contacted = (int)($byStatus['contacted'] ?? 0);
        $notContacted = (int)($byStatus['not_contacted'] ?? 0);

        $conversionRate = $total > 0 ? round(100 * $converted / $total, 1) : 0;
        $touched = $contacted + $qualified + $converted;
        $qualifiedRate = $touched > 0 ? round(100 * ($qualified + $converted) / $touched, 1) : 0;

        return [
            'total' => $total,
            'not_contacted' => $notContacted,
            'contacted' => $contacted,
            'qualified' => $qualified,
            'converted' => $converted,
            'conversion_rate_pct' => $conversionRate,
            'pipeline_qualified_pct' => $qualifiedRate,
        ];
    }

    public function store()
    {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if (trim($data['name'] ?? '') === '') {
            return ['error' => 'Name is required'];
        }
        $status = $data['status'] ?? 'not_contacted';
        if (!in_array($status, self::$allowedStatus, true)) {
            $status = 'not_contacted';
        }
        if ($status === 'converted_to_company') {
            $status = 'not_contacted';
        }
        $priority = $data['priority'] ?? 'medium';
        if (!in_array($priority, self::$allowedPriority, true)) {
            $priority = 'medium';
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO prospects (name, industry, location, source, contact_phone, contact_email, contact_method, priority, notes, status, contacted_at)
            VALUES (:name, :industry, :location, :source, :contact_phone, :contact_email, :contact_method, :priority, :notes, :status, :contacted_at)
        ');
        $contactedAt = null;
        if ($status === 'contacted' || $status === 'qualified' || $status === 'converted_to_company') {
            $contactedAt = $data['contacted_at'] ?? date('Y-m-d H:i:s');
        }
        $stmt->execute([
            ':name' => trim($data['name']),
            ':industry' => isset($data['industry']) && $data['industry'] !== '' ? trim($data['industry']) : null,
            ':location' => isset($data['location']) && $data['location'] !== '' ? trim($data['location']) : null,
            ':source' => isset($data['source']) && $data['source'] !== '' ? trim($data['source']) : null,
            ':contact_phone' => isset($data['contact_phone']) && $data['contact_phone'] !== '' ? trim($data['contact_phone']) : null,
            ':contact_email' => isset($data['contact_email']) && $data['contact_email'] !== '' ? trim($data['contact_email']) : null,
            ':contact_method' => isset($data['contact_method']) && $data['contact_method'] !== '' ? trim($data['contact_method']) : 'phone',
            ':priority' => $priority,
            ':notes' => isset($data['notes']) && $data['notes'] !== '' ? trim($data['notes']) : null,
            ':status' => $status,
            ':contacted_at' => $contactedAt,
        ]);
        return $this->show((int)$this->pdo->lastInsertId());
    }

    public function update($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data)) {
            return ['error' => 'No data provided'];
        }

        $existing = $this->pdo->prepare('SELECT * FROM prospects WHERE id = :id');
        $existing->execute([':id' => $id]);
        $row = $existing->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return ['error' => 'Not found'];
        }
        if ($row['status'] === 'converted_to_company') {
            return ['error' => 'Cannot edit a converted prospect'];
        }

        $fields = ['name', 'industry', 'location', 'source', 'contact_phone', 'contact_email', 'contact_method', 'priority', 'notes', 'status'];
        $set = [];
        $params = [':id' => $id];

        foreach ($fields as $f) {
            if (!array_key_exists($f, $data)) {
                continue;
            }
            if ($f === 'status') {
                $v = $data['status'];
                if (!in_array($v, self::$allowedStatus, true)) {
                    continue;
                }
                if ($v === 'converted_to_company') {
                    continue;
                }
                $set[] = 'status = :status';
                $params[':status'] = $v;
                if ($v === 'contacted' || $v === 'qualified') {
                    $set[] = 'contacted_at = COALESCE(contacted_at, NOW())';
                }
            } elseif ($f === 'priority') {
                $v = $data['priority'];
                if (!in_array($v, self::$allowedPriority, true)) {
                    $v = 'medium';
                }
                $set[] = 'priority = :priority';
                $params[':priority'] = $v;
            } else {
                $val = is_string($data[$f]) ? trim($data[$f]) : $data[$f];
                if ($f === 'name' && ($val === null || $val === '')) {
                    return ['error' => 'Name cannot be empty'];
                }
                $set[] = "`$f` = :$f";
                $params[":$f"] = $val;
            }
        }

        if (empty($set)) {
            return $this->show($id);
        }

        $sql = 'UPDATE prospects SET ' . implode(', ', $set) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->show($id);
    }

    public function convertToCompany($id)
    {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];

        $stmt = $this->pdo->prepare('SELECT * FROM prospects WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$p) {
            return ['error' => 'Prospect not found'];
        }
        if ($p['status'] === 'converted_to_company' && !empty($p['company_id'])) {
            return ['error' => 'Already converted', 'company_id' => (int)$p['company_id']];
        }
        if ($p['status'] !== 'qualified') {
            return ['error' => 'Prospect must be qualified before conversion'];
        }

        $this->pdo->beginTransaction();
        try {
            $ins = $this->pdo->prepare('
                INSERT INTO companies
                (name, industry, website_url, has_website, location, contact_person, contact_method, contact_phone, contact_email, contact_whatsapp, status, priority, last_contact_date, notes)
                VALUES
                (:name, :industry, :website_url, :has_website, :location, :contact_person, :contact_method, :contact_phone, :contact_email, :contact_whatsapp, :status, :priority, :last_contact_date, :notes)
            ');
            $notes = $p['notes'] ?? '';
            if (!empty($p['source'])) {
                $notes = trim($notes . "\n\nSource (prospect): " . $p['source']);
            }
            $ins->execute([
                ':name' => $p['name'],
                ':industry' => $p['industry'],
                ':website_url' => $data['website_url'] ?? null,
                ':has_website' => isset($data['has_website']) ? (int)$data['has_website'] : 0,
                ':location' => $p['location'],
                ':contact_person' => $data['contact_person'] ?? null,
                ':contact_method' => $data['contact_method'] ?? ($p['contact_method'] ?? 'whatsapp'),
                ':contact_phone' => $p['contact_phone'] ?? null,
                ':contact_email' => $p['contact_email'] ?? null,
                ':contact_whatsapp' => $p['contact_whatsapp'] ?? null,
                ':status' => $data['company_status'] ?? 'contacted',
                ':priority' => $p['priority'],
                ':last_contact_date' => date('Y-m-d'),
                ':notes' => $notes ?: null,
            ]);
            $companyId = (int)$this->pdo->lastInsertId();

            $upd = $this->pdo->prepare('
                UPDATE prospects SET status = :st, company_id = :cid, updated_at = NOW() WHERE id = :id
            ');
            $upd->execute([
                ':st' => 'converted_to_company',
                ':cid' => $companyId,
                ':id' => $id,
            ]);
            $this->pdo->commit();

            return [
                'company_id' => $companyId,
                'prospect' => $this->show($id),
            ];
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function destroy($id)
    {
        $stmt = $this->pdo->prepare('DELETE FROM prospects WHERE id = :id AND status != :st');
        $stmt->execute([':id' => $id, ':st' => 'converted_to_company']);
        if ($stmt->rowCount() === 0) {
            $check = $this->pdo->prepare('SELECT id FROM prospects WHERE id = :id');
            $check->execute([':id' => $id]);
            if ($check->fetch()) {
                return ['error' => 'Cannot delete converted prospect; remove linked company first if needed'];
            }
            return ['deleted' => false];
        }
        return ['deleted' => true];
    }
}
