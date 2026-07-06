<?php

class CompetitorsController
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    private function decodeJsonArray($value)
    {
        if ($value === null || $value === '') {
            return [];
        }
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            return is_array($decoded) ? $decoded : [];
        }
        return [];
    }

    private function rowOut($row)
    {
        if (!$row) {
            return null;
        }
        $row['tags'] = $this->decodeJsonArray($row['tags'] ?? null);
        $row['strengths'] = $this->decodeJsonArray($row['strengths'] ?? null);
        $row['weaknesses'] = $this->decodeJsonArray($row['weaknesses'] ?? null);
        $row['is_active'] = isset($row['is_active']) ? (int)$row['is_active'] : 0;
        return $row;
    }

    public function index($query = [])
    {
        $pdo = $this->pdo;
        $sql = 'SELECT * FROM competitors WHERE 1=1';
        $params = [];

        if (!empty($query['q'])) {
            $sql .= ' AND (name LIKE :q OR description LIKE :q2 OR industry LIKE :q3)';
            $params[':q'] = '%' . $query['q'] . '%';
            $params[':q2'] = '%' . $query['q'] . '%';
            $params[':q3'] = '%' . $query['q'] . '%';
        }
        if (!empty($query['industry'])) {
            $sql .= ' AND industry LIKE :industry';
            $params[':industry'] = '%' . $query['industry'] . '%';
        }
        if (!empty($query['threat_level'])) {
            $sql .= ' AND threat_level = :threat_level';
            $params[':threat_level'] = $query['threat_level'];
        }
        if (isset($query['is_active']) && $query['is_active'] !== '') {
            $sql .= ' AND is_active = :is_active';
            $params[':is_active'] = (int)$query['is_active'];
        }

        $allowedSort = ['name', 'industry', 'threat_level', 'created_at', 'updated_at'];
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

        $countSql = 'SELECT COUNT(*) FROM competitors WHERE 1=1';
        $countParams = [];
        if (!empty($query['q'])) {
            $countSql .= ' AND (name LIKE :q OR description LIKE :q2 OR industry LIKE :q3)';
            $countParams[':q'] = '%' . $query['q'] . '%';
            $countParams[':q2'] = '%' . $query['q'] . '%';
            $countParams[':q3'] = '%' . $query['q'] . '%';
        }
        if (!empty($query['industry'])) {
            $countSql .= ' AND industry LIKE :industry';
            $countParams[':industry'] = '%' . $query['industry'] . '%';
        }
        if (!empty($query['threat_level'])) {
            $countSql .= ' AND threat_level = :threat_level';
            $countParams[':threat_level'] = $query['threat_level'];
        }
        if (isset($query['is_active']) && $query['is_active'] !== '') {
            $countSql .= ' AND is_active = :is_active';
            $countParams[':is_active'] = (int)$query['is_active'];
        }

        $countStmt = $pdo->prepare($countSql);
        foreach ($countParams as $k => $v) {
            $countStmt->bindValue($k, $v);
        }
        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        $out = [];
        foreach ($rows as $r) {
            $out[] = $this->rowOut($r);
        }

        return [
            'data' => $out,
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $perPage ? (int)ceil($total / $perPage) : 1,
        ];
    }

    public function show($id)
    {
        $stmt = $this->pdo->prepare('SELECT * FROM competitors WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return ['error' => 'Not found'];
        }
        return $this->rowOut($row);
    }

    public function stats()
    {
        $pdo = $this->pdo;
        $sql = 'SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_tracked,
            SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS new_last_30d
            FROM competitors';
        $row = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
        return [
            'total' => (int)($row['total'] ?? 0),
            'active_tracked' => (int)($row['active_tracked'] ?? 0),
            'new_last_30d' => (int)($row['new_last_30d'] ?? 0),
        ];
    }

    private function normalizeArray($v)
    {
        if ($v === null || $v === '') {
            return [];
        }
        if (is_array($v)) {
            return array_values(array_filter(array_map('trim', $v), function ($x) {
                return $x !== '';
            }));
        }
        if (is_string($v)) {
            $parts = preg_split('/[\r\n,]+/', $v);
            return array_values(array_filter(array_map('trim', $parts), function ($x) {
                return $x !== '';
            }));
        }
        return [];
    }

    public function store()
    {
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        if (trim($data['name'] ?? '') === '') {
            return ['error' => 'Name is required'];
        }
        $tags = $this->normalizeArray($data['tags'] ?? null);
        $strengths = $this->normalizeArray($data['strengths'] ?? null);
        $weaknesses = $this->normalizeArray($data['weaknesses'] ?? null);

        $threat = $data['threat_level'] ?? 'medium';
        $allowedThreat = ['low', 'medium', 'high', 'critical'];
        if (!in_array($threat, $allowedThreat)) {
            $threat = 'medium';
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO competitors (
                name, industry, description, website, threat_level,
                tags, strengths, weaknesses,
                mission, company_size, location, products_services, tech_stack, target_market, pricing_models,
                is_active, notes
            ) VALUES (
                :name, :industry, :description, :website, :threat_level,
                :tags, :strengths, :weaknesses,
                :mission, :company_size, :location, :products_services, :tech_stack, :target_market, :pricing_models,
                :is_active, :notes
            )
        ');
        $stmt->execute([
            ':name' => $data['name'] ?? '',
            ':industry' => $data['industry'] ?? null,
            ':description' => $data['description'] ?? null,
            ':website' => $data['website'] ?? null,
            ':threat_level' => $threat,
            ':tags' => json_encode($tags),
            ':strengths' => json_encode($strengths),
            ':weaknesses' => json_encode($weaknesses),
            ':mission' => $data['mission'] ?? null,
            ':company_size' => $data['company_size'] ?? null,
            ':location' => $data['location'] ?? null,
            ':products_services' => $data['products_services'] ?? null,
            ':tech_stack' => $data['tech_stack'] ?? null,
            ':target_market' => $data['target_market'] ?? null,
            ':pricing_models' => $data['pricing_models'] ?? null,
            ':is_active' => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            ':notes' => $data['notes'] ?? null,
        ]);
        $id = (int)$this->pdo->lastInsertId();
        return $this->show($id);
    }

    public function update($id)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data)) {
            throw new Exception('No data provided', 400);
        }

        $existing = $this->pdo->prepare('SELECT id FROM competitors WHERE id = :id');
        $existing->execute([':id' => $id]);
        if (!$existing->fetch()) {
            return ['error' => 'Not found'];
        }

        $fields = [
            'name', 'industry', 'description', 'website', 'threat_level',
            'mission', 'company_size', 'location', 'products_services', 'tech_stack',
            'target_market', 'pricing_models', 'is_active', 'notes',
        ];
        $set = [];
        $params = [':id' => $id];

        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                if ($f === 'is_active') {
                    $set[] = 'is_active = :is_active';
                    $params[':is_active'] = (int)(bool)$data['is_active'];
                } elseif ($f === 'threat_level') {
                    $allowedThreat = ['low', 'medium', 'high', 'critical'];
                    $v = in_array($data['threat_level'], $allowedThreat) ? $data['threat_level'] : 'medium';
                    $set[] = 'threat_level = :threat_level';
                    $params[':threat_level'] = $v;
                } else {
                    $set[] = "`$f` = :$f";
                    $params[":$f"] = $data[$f];
                }
            }
        }

        if (array_key_exists('tags', $data)) {
            $set[] = 'tags = :tags';
            $params[':tags'] = json_encode($this->normalizeArray($data['tags']));
        }
        if (array_key_exists('strengths', $data)) {
            $set[] = 'strengths = :strengths';
            $params[':strengths'] = json_encode($this->normalizeArray($data['strengths']));
        }
        if (array_key_exists('weaknesses', $data)) {
            $set[] = 'weaknesses = :weaknesses';
            $params[':weaknesses'] = json_encode($this->normalizeArray($data['weaknesses']));
        }

        if (empty($set)) {
            return $this->show($id);
        }

        $sql = 'UPDATE competitors SET ' . implode(', ', $set) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->show($id);
    }

    public function destroy($id)
    {
        $stmt = $this->pdo->prepare('DELETE FROM competitors WHERE id = :id');
        $stmt->execute([':id' => $id]);
        $deleted = $stmt->rowCount();
        return ['deleted' => $deleted > 0];
    }
}
