<?php
require_once __DIR__ . '/../lib/XlsxSimpleReader.php';

if (!function_exists('respond')) {
    function respond($data, $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }
}

class ImportController
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Parse CSV or XLSX upload into list of associative rows (header row required).
     */
    private function parseRowsFromUpload(): array
    {
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            respond(['error' => 'File required'], 400);
        }
        $tmp = $_FILES['file']['tmp_name'];
        $name = $_FILES['file']['name'] ?? '';
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));

        if ($ext === 'csv') {
            return $this->parseCsv($tmp);
        }
        if (in_array($ext, ['xlsx', 'xlsm'], true)) {
            return $this->parseXlsx($tmp);
        }
        // Legacy .xls (binary) not supported without PhpSpreadsheet
        if ($ext === 'xls') {
            respond(['error' => 'Old .xls format not supported. Save as .xlsx or .csv in Excel.'], 400);
        }
        respond(['error' => 'Unsupported file type. Use .csv or .xlsx'], 400);
    }

    private function parseCsv(string $tmp): array
    {
        $fh = fopen($tmp, 'r');
        if (!$fh) {
            respond(['error' => 'Could not read file'], 400);
        }
        $header = fgetcsv($fh);
        if (!$header) {
            fclose($fh);
            respond(['error' => 'Empty CSV'], 400);
        }
        $header = $this->normalizeHeader($header);
        $rows = [];
        while (($line = fgetcsv($fh)) !== false) {
            if ($this->rowIsEmpty($line)) {
                continue;
            }
            $line = $this->padRow($line, count($header));
            $rows[] = array_combine($header, $line);
        }
        fclose($fh);
        return $rows;
    }

    private function parseXlsx(string $tmp): array
    {
        try {
            $grid = XlsxSimpleReader::toRows($tmp);
        } catch (Exception $e) {
            respond(['error' => 'XLSX read failed: ' . $e->getMessage()], 400);
        }
        if (empty($grid)) {
            respond(['error' => 'Empty spreadsheet'], 400);
        }
        $header = $this->normalizeHeader($grid[0]);
        $rows = [];
        for ($i = 1; $i < count($grid); $i++) {
            $line = $grid[$i];
            if ($this->rowIsEmpty($line)) {
                continue;
            }
            $line = $this->padRow($line, count($header));
            $rows[] = array_combine($header, $line);
        }
        return $rows;
    }

    private function normalizeHeader(array $header): array
    {
        $seen = [];
        $out = [];
        foreach ($header as $h) {
            $k = strtolower(trim((string)$h));
            if ($k === '') {
                $k = 'column';
            }
            $base = $k;
            $n = 1;
            while (isset($seen[$k])) {
                $n++;
                $k = $base . '_' . $n;
            }
            $seen[$k] = true;
            $out[] = $k;
        }
        return $out;
    }

    private function rowIsEmpty(array $line): bool
    {
        foreach ($line as $cell) {
            if (trim((string)$cell) !== '') {
                return false;
            }
        }
        return true;
    }

    private function padRow(array $line, int $len): array
    {
        while (count($line) < $len) {
            $line[] = '';
        }
        return array_slice($line, 0, $len);
    }

    /**
     * Map Demand Capture / Discovery Intelligence export columns to prospect import fields.
     * Outreach CSV: business, email, phone, subject, body, maps_url
     * Discovery fields: name, city, country, website, industry
     */
    private function mapProspectImportRow(array $r): array
    {
        if (trim((string)($r['name'] ?? '')) === '' && trim((string)($r['business'] ?? '')) !== '') {
            $r['name'] = trim((string)$r['business']);
        }

        if (trim((string)($r['location'] ?? '')) === '') {
            $city = trim((string)($r['city'] ?? ''));
            $country = trim((string)($r['country'] ?? ''));
            if ($city !== '' && $country !== '') {
                $r['location'] = $city . ', ' . $country;
            } elseif ($city !== '') {
                $r['location'] = $city;
            } elseif ($country !== '') {
                $r['location'] = $country;
            }
        }

        $hasDiscoveryMarkers = trim((string)($r['business'] ?? '')) !== ''
            || trim((string)($r['maps_url'] ?? '')) !== ''
            || trim((string)($r['google_maps_url'] ?? '')) !== '';

        if (trim((string)($r['source'] ?? '')) === '' && $hasDiscoveryMarkers) {
            $r['source'] = 'Discovery Intelligence';
        }

        if (trim((string)($r['notes'] ?? '')) === '') {
            $parts = [];
            foreach (['website', 'website_url', 'subject', 'body', 'maps_url', 'google_maps_url'] as $key) {
                $val = trim((string)($r[$key] ?? ''));
                if ($val === '') {
                    continue;
                }
                $label = ucwords(str_replace('_', ' ', $key));
                $parts[] = $label . ': ' . $val;
            }
            if ($parts !== []) {
                $r['notes'] = implode("\n", $parts);
            }
        }

        return $r;
    }

    private function cellToList($v): array
    {
        if ($v === null || $v === '') {
            return [];
        }
        if (is_array($v)) {
            return array_values(array_filter(array_map('trim', $v)));
        }
        $s = (string)$v;
        return array_values(array_filter(array_map('trim', preg_split('/[\r\n,|]+/', $s))));
    }

    public function importCompanies()
    {
        $rows = $this->parseRowsFromUpload();
        if (empty($rows)) {
            respond(['error' => 'No data rows after header'], 400);
        }

        $this->pdo->beginTransaction();
        $sql = 'INSERT INTO companies (name,industry,website_url,has_website,location,contact_person,contact_method,contact_phone,contact_email,contact_whatsapp,status,priority,last_contact_date,notes)
                VALUES (:name,:industry,:website_url,:has_website,:location,:contact_person,:contact_method,:contact_phone,:contact_email,:contact_whatsapp,:status,:priority,:last_contact_date,:notes)';
        $stmt = $this->pdo->prepare($sql);
        $count = 0;
        foreach ($rows as $r) {
            $name = trim($r['name'] ?? '');
            if ($name === '') {
                continue;
            }
            $website = $r['website_url'] ?? $r['website'] ?? null;
            $website = $website !== null && $website !== '' ? trim((string)$website) : null;
            $params = [
                ':name' => $name,
                ':industry' => isset($r['industry']) && $r['industry'] !== '' ? trim((string)$r['industry']) : null,
                ':website_url' => $website,
                ':has_website' => isset($r['has_website']) ? (int)$r['has_website'] : ($website ? 1 : 0),
                ':location' => isset($r['location']) && $r['location'] !== '' ? trim((string)$r['location']) : null,
                ':contact_person' => isset($r['contact_person']) && $r['contact_person'] !== '' ? trim((string)$r['contact_person']) : null,
                ':contact_method' => isset($r['contact_method']) && $r['contact_method'] !== '' ? trim((string)$r['contact_method']) : 'whatsapp',
                ':contact_phone' => isset($r['contact_phone']) && $r['contact_phone'] !== '' ? trim((string)$r['contact_phone']) : null,
                ':contact_email' => isset($r['contact_email']) && $r['contact_email'] !== '' ? trim((string)$r['contact_email']) : null,
                ':contact_whatsapp' => isset($r['contact_whatsapp']) && $r['contact_whatsapp'] !== '' ? trim((string)$r['contact_whatsapp']) : null,
                ':status' => isset($r['status']) && $r['status'] !== '' ? trim((string)$r['status']) : 'not_contacted',
                ':priority' => isset($r['priority']) && $r['priority'] !== '' ? trim((string)$r['priority']) : 'medium',
                ':last_contact_date' => isset($r['last_contact_date']) && $r['last_contact_date'] !== '' ? trim((string)$r['last_contact_date']) : null,
                ':notes' => isset($r['notes']) && $r['notes'] !== '' ? trim((string)$r['notes']) : null,
            ];
            $stmt->execute($params);
            $count++;
        }
        $this->pdo->commit();
        respond(['inserted' => $count]);
    }

    public function importCompetitors()
    {
        $rows = $this->parseRowsFromUpload();
        if (empty($rows)) {
            respond(['error' => 'No data rows after header'], 400);
        }

        $sql = 'INSERT INTO competitors (
            name, industry, description, website, threat_level,
            tags, strengths, weaknesses,
            mission, company_size, location, products_services, tech_stack, target_market, pricing_models,
            is_active, notes
        ) VALUES (
            :name, :industry, :description, :website, :threat_level,
            :tags, :strengths, :weaknesses,
            :mission, :company_size, :location, :products_services, :tech_stack, :target_market, :pricing_models,
            :is_active, :notes
        )';
        $stmt = $this->pdo->prepare($sql);

        $this->pdo->beginTransaction();
        $count = 0;
        foreach ($rows as $r) {
            $name = trim($r['name'] ?? '');
            if ($name === '') {
                continue;
            }
            $threat = strtolower(trim((string)($r['threat_level'] ?? 'medium')));
            if (!in_array($threat, ['low', 'medium', 'high', 'critical'], true)) {
                $threat = 'medium';
            }
            $tags = $this->cellToList($r['tags'] ?? '');
            $strengths = $this->cellToList($r['strengths'] ?? '');
            $weaknesses = $this->cellToList($r['weaknesses'] ?? '');

            $active = 1;
            if (isset($r['is_active'])) {
                $v = strtolower(trim((string)$r['is_active']));
                if (in_array($v, ['0', 'no', 'false', 'inactive'], true)) {
                    $active = 0;
                }
            }

            $website = $r['website'] ?? $r['website_url'] ?? null;
            $website = $website !== null && $website !== '' ? trim((string)$website) : null;

            $stmt->execute([
                ':name' => $name,
                ':industry' => isset($r['industry']) && $r['industry'] !== '' ? trim((string)$r['industry']) : null,
                ':description' => isset($r['description']) && $r['description'] !== '' ? trim((string)$r['description']) : null,
                ':website' => $website,
                ':threat_level' => $threat,
                ':tags' => json_encode($tags),
                ':strengths' => json_encode($strengths),
                ':weaknesses' => json_encode($weaknesses),
                ':mission' => isset($r['mission']) && $r['mission'] !== '' ? trim((string)$r['mission']) : null,
                ':company_size' => isset($r['company_size']) && $r['company_size'] !== '' ? trim((string)$r['company_size']) : null,
                ':location' => isset($r['location']) && $r['location'] !== '' ? trim((string)$r['location']) : null,
                ':products_services' => isset($r['products_services']) && $r['products_services'] !== '' ? trim((string)$r['products_services']) : null,
                ':tech_stack' => isset($r['tech_stack']) && $r['tech_stack'] !== '' ? trim((string)$r['tech_stack']) : null,
                ':target_market' => isset($r['target_market']) && $r['target_market'] !== '' ? trim((string)$r['target_market']) : null,
                ':pricing_models' => isset($r['pricing_models']) && $r['pricing_models'] !== '' ? trim((string)$r['pricing_models']) : null,
                ':is_active' => $active,
                ':notes' => isset($r['notes']) && $r['notes'] !== '' ? trim((string)$r['notes']) : null,
            ]);
            $count++;
        }
        $this->pdo->commit();
        respond(['inserted' => $count]);
    }

    public function importProspects()
    {
        $rows = $this->parseRowsFromUpload();
        if (empty($rows)) {
            respond(['error' => 'No data rows after header'], 400);
        }

        $allowedStatus = ['not_contacted', 'contacted', 'qualified', 'converted_to_company'];
        $allowedPriority = ['high', 'medium', 'low'];

        $sql = 'INSERT INTO prospects (name, industry, location, source, priority, notes, status, contacted_at)
                VALUES (:name, :industry, :location, :source, :priority, :notes, :status, :contacted_at)';
        $stmt = $this->pdo->prepare($sql);

        $this->pdo->beginTransaction();
        $count = 0;
        foreach ($rows as $r) {
            $r = $this->mapProspectImportRow($r);
            $name = trim($r['name'] ?? '');
            if ($name === '') {
                continue;
            }
            $st = strtolower(trim((string)($r['status'] ?? 'not_contacted')));
            $st = str_replace([' ', '-'], '_', $st);
            if (!in_array($st, $allowedStatus, true)) {
                $st = 'not_contacted';
            }
            if ($st === 'converted_to_company') {
                $st = 'qualified';
            }

            $pr = strtolower(trim((string)($r['priority'] ?? 'medium')));
            if (!in_array($pr, $allowedPriority, true)) {
                $pr = 'medium';
            }

            $contactedAt = null;
            if (in_array($st, ['contacted', 'qualified'], true)) {
                $contactedAt = isset($r['contacted_at']) && $r['contacted_at'] !== ''
                    ? trim((string)$r['contacted_at'])
                    : date('Y-m-d H:i:s');
            }

            $stmt->execute([
                ':name' => $name,
                ':industry' => isset($r['industry']) && $r['industry'] !== '' ? trim((string)$r['industry']) : null,
                ':location' => isset($r['location']) && $r['location'] !== '' ? trim((string)$r['location']) : null,
                ':source' => isset($r['source']) && $r['source'] !== '' ? trim((string)$r['source']) : null,
                ':priority' => $pr,
                ':notes' => isset($r['notes']) && $r['notes'] !== '' ? trim((string)$r['notes']) : null,
                ':status' => $st,
                ':contacted_at' => $contactedAt,
            ]);
            $count++;
        }
        $this->pdo->commit();
        respond(['inserted' => $count]);
    }
}
