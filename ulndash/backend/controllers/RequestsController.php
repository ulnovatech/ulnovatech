<?php
// controllers/RequestsController.php

class RequestsController {
    private $pdo;
    // Map of request types to table metadata:
    private $sources = [
        'appdev' => [
            'table' => 'appdevrequests',
            // source_id column, name, phone, description, submitted datetime column
            'id' => 'id', 'name' => 'name', 'phone' => 'phone', 'description' => 'description', 'submitted_at' => 'submitted_at'
        ],
        'graphdes' => [
            'table' => 'graphdesrequests',
            'id' => 'id', 'name' => 'name', 'phone' => 'phone', 'description' => 'description', 'submitted_at' => 'created_at'
        ],
        'marketing' => [
            'table' => 'marketingrequests',
            'id' => 'id', 'name' => 'name', 'phone' => 'phone', 'description' => 'description', 'submitted_at' => 'created_at'
        ],
        'webdesign' => [
            'table' => 'webdesigninq',
            'id' => 'id', 'name' => 'name', 'phone' => 'phone', 'description' => 'description', 'submitted_at' => 'received_at'
        ],
        'website_order' => [
            'table' => 'website_orders',
            'id' => 'id', 'name' => 'name', 'phone' => 'phone', 'description' => 'details', 'submitted_at' => 'submitted_at'
        ],
        'contactus' => [
            'table' => 'contactus',
            'id' => 'id', 'name' => 'name', 'phone' => 'phone', 'description' => 'message', 'email' => 'email', 'submitted_at' => 'received_at'
        ],
        'newsletter' => [
            'table' => 'newsletter',
            'id' => 'id', 'name' => null, 'phone' => null, 'description' => null, 'email' => 'email', 'submitted_at' => 'received_at'
        ],
    ];

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /** @return array<string, array<string, mixed>> */
    public function getSourcesMeta(): array
    {
        return $this->sources;
    }

    // GET /api/requests
    // Supports: type (comma-separated), q (search name/phone/email), sort, dir, page, per_page
    public function index($query = []) {
        try {
            $pdo = $this->pdo;

            // parse types filter
            $requestedTypes = [];
            if (!empty($query['type'])) {
                // allow comma-separated types
                $requestedTypes = array_filter(array_map('trim', explode(',', $query['type'])));
            } else {
                // default: include all sources
                $requestedTypes = array_keys($this->sources);
            }

            // sanitize: only keep known types
            $requestedTypes = array_values(array_intersect($requestedTypes, array_keys($this->sources)));
            if (empty($requestedTypes)) {
                // if after filtering none, return empty dataset
                return ['data'=>[], 'page'=>1, 'per_page'=>0, 'total'=>0, 'total_pages'=>0];
            }

            $q = $query['q'] ?? null;
            $sort = $query['sort'] ?? 'submitted_at';
            $allowedSorts = ['submitted_at','name','type'];
            if (!in_array($sort, $allowedSorts)) $sort = 'submitted_at';
            $dir = strtoupper($query['dir'] ?? 'DESC');
            $dir = in_array($dir, ['ASC','DESC']) ? $dir : 'DESC';

            $page = isset($query['page']) ? max(1, (int)$query['page']) : 1;
            $perPage = isset($query['per_page']) ? max(1, min(200, (int)$query['per_page'])) : 25;
            $offset = ($page - 1) * $perPage;

            // We'll build a UNION ALL query across selected tables, normalizing columns.
            $unionParts = [];
            $binds = [];
            $i = 0;
            foreach ($requestedTypes as $typeKey) {
                $meta = $this->sources[$typeKey];
                $tbl = $meta['table'];
                $idCol = $meta['id'] ?? 'id';
                $nameCol = $meta['name'] ?? 'NULL';
                $phoneCol = $meta['phone'] ?? 'NULL';
                $descCol = $meta['description'] ?? 'NULL';
                $emailCol = $meta['email'] ?? 'NULL';
                $submittedCol = $meta['submitted_at'] ?? 'NULL';

                // Create aliases to normalize
                $unionParts[] = "SELECT 
                    :type_{$i} AS request_type,
                    {$idCol} AS source_id,
                    {$this->colOrNull($nameCol)} AS name,
                    {$this->colOrNull($phoneCol)} AS phone,
                    {$this->colOrNull($emailCol)} AS email,
                    {$this->colOrNull($descCol)} AS description,
                    {$this->colOrNull($submittedCol)} AS submitted_at
                FROM `{$tbl}`";
                $binds[":type_{$i}"] = $typeKey;
                $i++;
            }

            $unionSQL = implode(" UNION ALL ", $unionParts);

            // Wrap the union so we can filter/search/sort
            $finalSql = "SELECT * FROM (\n{$unionSQL}\n) AS combined WHERE 1=1";
            // Search
            if ($q) {
                $finalSql .= " AND (name LIKE :q OR phone LIKE :q OR email LIKE :q OR description LIKE :q)";
                $binds[':q'] = "%{$q}%";
            }

            // Sorting: name, submitted_at, type
            $finalSql .= " ORDER BY {$sort} {$dir}";

            // add pagination
            $finalSql .= " LIMIT :limit OFFSET :offset";

            $stmt = $pdo->prepare($finalSql);

            // bind type placeholders and search
            foreach ($binds as $k => $v) {
                // types and q bound as strings
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // total count: we need to count using same union and same search (no limit)
            $countSql = "SELECT COUNT(*) as cnt FROM (\n{$unionSQL}\n) AS combined WHERE 1=1";
            if ($q) {
                $countSql .= " AND (name LIKE :q2 OR phone LIKE :q2 OR email LIKE :q2 OR description LIKE :q2)";
            }
            $countStmt = $pdo->prepare($countSql);
            // bind types again:
            foreach ($binds as $k => $v) {
                // skip :limit/:offset if they were added in binds (they are not)
                if ($k === ':limit' || $k === ':offset') continue;
                // for count we must not bind :limit/:offset — but :q is fine
                if ($k === ':q') {
                    // bind to :q2 for count
                    $countStmt->bindValue(':q2', $v);
                } else {
                    $countStmt->bindValue($k, $v);
                }
            }
            $countStmt->execute();
            $total = (int)$countStmt->fetchColumn();

            // normalize each row's submitted_at to ISO if necessary
            foreach ($rows as &$r) {
                if (!empty($r['submitted_at'])) {
                    // ensure format YYYY-MM-DD HH:MM:SS
                    $r['submitted_at'] = $r['submitted_at'];
                } else {
                    $r['submitted_at'] = null;
                }
            }
            unset($r);

            $this->attachContactFlags($rows);

            return [
                'data' => $rows,
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => $perPage ? ceil($total / $perPage) : 1
            ];
        } catch (Exception $e) {
            throw new Exception($e->getMessage(), 500);
        }
    }

    // Helper: return column or NULL literal
    private function colOrNull($col) {
        if ($col === null) return 'NULL';
        // If col is already 'NULL' string
        if (strtoupper($col) === 'NULL') return 'NULL';
        // otherwise escape identifier (simple)
        return "`{$col}`";
    }

    // Optional: get single request by type + id
    // GET /api/requests/{type}/{id}
    public function show($type, $id) {
        if (!isset($this->sources[$type])) {
            throw new Exception('Unknown request type', 404);
        }
        $meta = $this->sources[$type];
        $tbl = $meta['table'];
        $idCol = $meta['id'];

        $stmt = $this->pdo->prepare("SELECT * FROM `{$tbl}` WHERE `{$idCol}` = :id LIMIT 1");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new Exception('Not found', 404);
        }

        // map to normalized object
        $out = [
            'request_type' => $type,
            'source_id' => $row[$idCol],
            'name' => $meta['name'] ? ($row[$meta['name']] ?? null) : null,
            'phone' => $meta['phone'] ? ($row[$meta['phone']] ?? null) : null,
            'email' => $meta['email'] ? ($row[$meta['email']] ?? null) : null,
            'description' => $meta['description'] ? ($row[$meta['description']] ?? null) : null,
            'submitted_at' => $row[$meta['submitted_at']] ?? null,
            'raw' => $row,
        ];

        $contact = $this->getContactRecord($type, (int) $id);
        $out['contacted'] = $contact !== null;
        $out['contact'] = $contact;

        if ($type === 'website_order') {
            require_once __DIR__ . '/../services/OrderPaymentSummaryService.php';
            $paymentService = new OrderPaymentSummaryService($this->pdo);
            $payment = $paymentService->forWebsiteOrder($out);
            if ($payment) {
                $out['payment'] = $payment;
            }
        }

        return $out;
    }

    public function markContacted(string $type, int $id, string $username, array $body = []): array
    {
        if (!isset($this->sources[$type])) {
            throw new Exception('Unknown request type', 404);
        }

        if (!$this->tableExists('lead_contacts')) {
            throw new Exception('Contact tracking is not installed. Run apply_lead_contacts.php', 503);
        }

        // Ensure lead exists
        $this->show($type, $id);

        $channel = trim((string) ($body['channel'] ?? 'mobile'));
        if ($channel === '') {
            $channel = 'mobile';
        }
        $notes = trim((string) ($body['notes'] ?? ''));
        $notes = $notes !== '' ? substr($notes, 0, 500) : null;

        $stmt = $this->pdo->prepare(
            'INSERT INTO lead_contacts (request_type, source_id, contacted_by, channel, notes, contacted_at)
             VALUES (:type, :id, :by, :channel, :notes, NOW())
             ON DUPLICATE KEY UPDATE
               contacted_by = VALUES(contacted_by),
               channel = VALUES(channel),
               notes = COALESCE(VALUES(notes), notes),
               contacted_at = NOW()'
        );
        $stmt->execute([
            ':type' => $type,
            ':id' => $id,
            ':by' => substr($username, 0, 100),
            ':channel' => substr($channel, 0, 32),
            ':notes' => $notes,
        ]);

        $contact = $this->getContactRecord($type, $id);

        return [
            'success' => true,
            'contacted' => true,
            'contact' => $contact,
        ];
    }

    private function getContactRecord(string $type, int $id): ?array
    {
        if (!$this->tableExists('lead_contacts')) {
            return null;
        }

        $stmt = $this->pdo->prepare(
            'SELECT request_type, source_id, contacted_by, channel, notes, contacted_at
             FROM lead_contacts
             WHERE request_type = :type AND source_id = :id
             LIMIT 1'
        );
        $stmt->execute([
            ':type' => $type,
            ':id' => $id,
        ]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /** @param list<array<string, mixed>> $rows */
    private function attachContactFlags(array &$rows): void
    {
        if (!$this->tableExists('lead_contacts') || $rows === []) {
            foreach ($rows as &$row) {
                $row['contacted'] = false;
            }
            unset($row);
            return;
        }

        $pairs = [];
        foreach ($rows as $row) {
            $type = $row['request_type'] ?? '';
            $id = (int) ($row['source_id'] ?? 0);
            if ($type !== '' && $id > 0) {
                $pairs[] = [$type, $id];
            }
        }

        if ($pairs === []) {
            foreach ($rows as &$row) {
                $row['contacted'] = false;
            }
            unset($row);
            return;
        }

        $placeholders = implode(',', array_fill(0, count($pairs), '(?,?)'));
        $flat = [];
        foreach ($pairs as [$type, $id]) {
            $flat[] = $type;
            $flat[] = $id;
        }

        $stmt = $this->pdo->prepare(
            "SELECT request_type, source_id, contacted_at
             FROM lead_contacts
             WHERE (request_type, source_id) IN ({$placeholders})"
        );
        $stmt->execute($flat);
        $contacted = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $key = $row['request_type'] . ':' . $row['source_id'];
            $contacted[$key] = $row['contacted_at'];
        }

        foreach ($rows as &$row) {
            $key = ($row['request_type'] ?? '') . ':' . ($row['source_id'] ?? '');
            $row['contacted'] = isset($contacted[$key]);
            $row['contacted_at'] = $contacted[$key] ?? null;
        }
        unset($row);
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
    
    public function convertToCompany($id) {
    // Fetch the request data (from appdevrequests table as example)
    $stmt = $this->pdo->prepare("SELECT * FROM appdevrequests WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $request = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$request) {
        http_response_code(404);
        echo json_encode(['error' => 'Request not found']);
        return;
    }

    // Insert into companies table
    $insert = $this->pdo->prepare("
        INSERT INTO companies (name, contact_person, contact_method, status, priority, notes, created_at, updated_at)
        VALUES (:name, :contact_person, 'phone', 'not_contacted', 'medium', :notes, NOW(), NOW())
    ");
    $insert->execute([
        ':name' => $request['name'],
        ':contact_person' => $request['phone'],
        ':notes' => $request['description']
    ]);

    echo json_encode([
        'success' => true,
        'company_id' => $this->pdo->lastInsertId()
    ]);
}
}
