<?php
// controllers/CompanyController.php
class CompanyController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // List companies (already returns {data, page, per_page, total})
    public function index($query = []) {
        $pdo = $this->pdo;
        $sql = "SELECT * FROM companies WHERE 1=1";
        $params = [];

        if (!empty($query['status'])) {
            $sql .= " AND status = :status";
            $params[':status'] = $query['status'];
        }
        if (isset($query['has_website'])) {
            $sql .= " AND has_website = :has_website";
            $params[':has_website'] = (int)$query['has_website'];
        }
        if (!empty($query['location'])) {
            $sql .= " AND location LIKE :location";
            $params[':location'] = "%".$query['location']."%";
        }
        if (!empty($query['industry'])) {
            $sql .= " AND industry LIKE :industry";
            $params[':industry'] = "%".$query['industry']."%";
        }
        if (!empty($query['q'])) {
            $sql .= " AND (name LIKE :q OR notes LIKE :q2)";
            $params[':q'] = "%".$query['q']."%";
            $params[':q2'] = "%".$query['q']."%";
        }

        // Sorting
        $allowedSort = ['name','status','location','last_contact_date','created_at'];
        $sort = $query['sort'] ?? 'created_at';
        $sort = in_array($sort, $allowedSort) ? $sort : 'created_at';
        $dir = strtoupper($query['dir'] ?? 'DESC');
        $dir = in_array($dir, ['ASC','DESC']) ? $dir : 'DESC';
        $sql .= " ORDER BY $sort $dir";

        // Pagination
        $page = isset($query['page']) ? max(1, (int)$query['page']) : 1;
        $perPage = isset($query['per_page']) ? max(1, min(200, (int)$query['per_page'])) : 25;
        $offset = ($page - 1) * $perPage;
        $sql .= " LIMIT :limit OFFSET :offset";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) $stmt->bindValue($k, $v);
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $companies = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // total count (apply same filters)
        $countSql = "SELECT COUNT(*) FROM companies WHERE 1=1";
        $countParams = [];
        if (!empty($query['status'])) { $countSql .= " AND status = :status"; $countParams[':status'] = $query['status']; }
        if (isset($query['has_website'])) { $countSql .= " AND has_website = :has_website"; $countParams[':has_website'] = (int)$query['has_website']; }
        if (!empty($query['location'])) { $countSql .= " AND location LIKE :location"; $countParams[':location'] = "%".$query['location']."%"; }
        if (!empty($query['industry'])) { $countSql .= " AND industry LIKE :industry"; $countParams[':industry'] = "%".$query['industry']."%"; }
        if (!empty($query['q'])) { $countSql .= " AND (name LIKE :q OR notes LIKE :q2)"; $countParams[':q'] = "%".$query['q']."%"; $countParams[':q2'] = "%".$query['q']."%"; }

        $countStmt = $pdo->prepare($countSql);
        foreach ($countParams as $k => $v) $countStmt->bindValue($k, $v);
        $countStmt->execute();
        $total = $countStmt->fetchColumn();

        return [
            'data' => $companies,
            'page' => $page,
            'per_page' => $perPage,
            'total' => (int)$total,
            'total_pages' => $perPage ? ceil($total / $perPage) : 1
        ];
    }

    public function show($id) {
        $stmt = $this->pdo->prepare("SELECT * FROM companies WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode($stmt->fetch(PDO::FETCH_ASSOC));
    }

    public function store() {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $this->pdo->prepare("
            INSERT INTO companies 
            (name, industry, website_url, has_website, location, contact_person, contact_method, contact_phone, contact_email, contact_whatsapp, status, priority, last_contact_date, notes)
            VALUES 
            (:name, :industry, :website_url, :has_website, :location, :contact_person, :contact_method, :contact_phone, :contact_email, :contact_whatsapp, :status, :priority, :last_contact_date, :notes)
        ");
        $stmt->execute([
            ':name' => $data['name'] ?? null,
            ':industry' => $data['industry'] ?? null,
            ':website_url' => $data['website_url'] ?? null,
            ':has_website' => isset($data['has_website']) ? (int)$data['has_website'] : 0,
            ':location' => $data['location'] ?? null,
            ':contact_person' => $data['contact_person'] ?? null,
            ':contact_method' => $data['contact_method'] ?? 'whatsapp',
            ':contact_phone' => $data['contact_phone'] ?? null,
            ':contact_email' => $data['contact_email'] ?? null,
            ':contact_whatsapp' => $data['contact_whatsapp'] ?? null,
            ':status' => $data['status'] ?? 'not_contacted',
            ':priority' => $data['priority'] ?? 'medium',
            ':last_contact_date' => $data['last_contact_date'] ?? null,
            ':notes' => $data['notes'] ?? null
        ]);
        return ['id' => $this->pdo->lastInsertId()];
    }

    public function update($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data)) {
            throw new Exception("No data provided");
        }

        $existing = $this->pdo->prepare('SELECT id FROM companies WHERE id = :id');
        $existing->execute([':id' => $id]);
        if (!$existing->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            return;
        }

        $fields = [
            'name', 'industry', 'website_url', 'has_website', 'location',
            'contact_person', 'contact_method', 'contact_phone', 'contact_email',
            'contact_whatsapp', 'status', 'priority', 'last_contact_date', 'notes',
        ];
        $allowedStatus = ['not_contacted', 'contacted', 'interested', 'in_negotiation', 'closed_won', 'closed_lost'];
        $allowedPriority = ['low', 'medium', 'high'];
        $allowedMethods = ['phone', 'email', 'whatsapp', 'other'];

        $set = [];
        $params = [':id' => $id];

        foreach ($fields as $f) {
            if (!array_key_exists($f, $data)) {
                continue;
            }
            if ($f === 'has_website') {
                $set[] = 'has_website = :has_website';
                $params[':has_website'] = (int) (bool) $data['has_website'];
            } elseif ($f === 'status') {
                $v = in_array($data['status'], $allowedStatus, true) ? $data['status'] : 'not_contacted';
                $set[] = 'status = :status';
                $params[':status'] = $v;
            } elseif ($f === 'priority') {
                $v = in_array($data['priority'], $allowedPriority, true) ? $data['priority'] : 'medium';
                $set[] = 'priority = :priority';
                $params[':priority'] = $v;
            } elseif ($f === 'contact_method') {
                $v = in_array($data['contact_method'], $allowedMethods, true) ? $data['contact_method'] : 'whatsapp';
                $set[] = 'contact_method = :contact_method';
                $params[':contact_method'] = $v;
            } else {
                $set[] = "`$f` = :$f";
                $params[":$f"] = $data[$f];
            }
        }

        if (empty($set)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }

        $sql = 'UPDATE companies SET ' . implode(', ', $set) . ' WHERE id = :id';
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode(['updated' => true]);
    }

    public function destroy($id) {
        $stmt = $this->pdo->prepare("DELETE FROM companies WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['deleted' => true]);
    }

    // Stats: total/contacted/converted/conversion_rate
    public function stats() {
        $total = (int)$this->pdo->query("SELECT COUNT(*) FROM companies")->fetchColumn();
        $contacted = (int)$this->pdo->query("SELECT COUNT(*) FROM companies WHERE status IN ('contacted','interested','in_negotiation','closed_won','closed_lost')")->fetchColumn();
        $converted = (int)$this->pdo->query("SELECT COUNT(*) FROM companies WHERE status='closed_won'")->fetchColumn();

        // Optionally compute simple diffs if you store previous snapshot (not implemented here).
        return [
            'total' => $total,
            'contacted' => $contacted,
            'converted' => $converted,
            'conversion_rate' => $total ? round(($converted / $total) * 100, 2) : 0
        ];
    }

    // Activity: returns last N days counts grouped by date
    public function activity() {
        // Accept ?range=30d or ?days=30
        $range = $_GET['range'] ?? ($_GET['days'] ?? '30d');
        $days = 30;
        if (preg_match('/(\d+)/', $range, $m)) $days = (int)$m[1];

        // Build array of last $days dates
        $dates = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $dates[] = date('Y-m-d', strtotime("-{$i} days"));
        }

        // Query counts grouped by date (using created_at date)
        $stmt = $this->pdo->prepare("
            SELECT DATE(created_at) as day, COUNT(*) as cnt
            FROM companies
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
            GROUP BY day
            ORDER BY day ASC
        ");
        $stmt->bindValue(':days', $days, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $map = [];
        foreach ($rows as $r) $map[$r['day']] = (int)$r['cnt'];

        $out = [];
        foreach ($dates as $d) {
            $out[] = ['time' => $d, 'value' => $map[$d] ?? 0];
        }
        return $out;
    }

    // Top industries
    public function topIndustries() {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(NULLIF(industry, ''), 'Unknown') AS industry, COUNT(*) AS count
            FROM companies
            GROUP BY industry
            ORDER BY count DESC
            LIMIT :limit
        ");
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }
}
