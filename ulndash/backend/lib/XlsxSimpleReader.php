<?php
/**
 * Minimal XLSX → 2D array (first sheet) using ZipArchive + XML.
 * No external deps. Works for typical Excel exports (no merged header quirks).
 */
class XlsxSimpleReader
{
    public static function toRows(string $path): array
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new Exception('Could not open XLSX file');
        }

        $shared = self::readSharedStrings($zip);
        $sheetPath = self::resolveFirstSheetPath($zip);
        if ($sheetPath === null) {
            $zip->close();
            throw new Exception('No worksheet found in XLSX');
        }

        $sheetXml = $zip->getFromName($sheetPath);
        $zip->close();
        if ($sheetXml === false) {
            throw new Exception('Could not read worksheet XML');
        }

        $xml = @simplexml_load_string($sheetXml);
        if ($xml === false) {
            throw new Exception('Invalid worksheet XML');
        }
        $xml->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $rowNodes = $xml->xpath('//m:sheetData/m:row');
        if (!$rowNodes) {
            return [];
        }

        $rows = [];
        foreach ($rowNodes as $row) {
            $cells = $row->xpath('.//m:c');
            $line = [];
            foreach ($cells as $c) {
                $ref = (string)$c['r'];
                if (!preg_match('/^([A-Z]+)(\d+)$/i', $ref, $m)) {
                    continue;
                }
                $colIdx = self::colLettersToIndex($m[1]);
                $val = self::cellValue($c, $shared);
                $line[$colIdx] = $val;
            }
            if (!empty($line)) {
                ksort($line, SORT_NUMERIC);
                $max = max(array_keys($line));
                $out = [];
                for ($i = 0; $i <= $max; $i++) {
                    $out[] = $line[$i] ?? '';
                }
                $rows[] = $out;
            }
        }

        return $rows;
    }

    private static function readSharedStrings(ZipArchive $zip): array
    {
        if ($zip->locateName('xl/sharedStrings.xml') === false) {
            return [];
        }
        $raw = $zip->getFromName('xl/sharedStrings.xml');
        $xml = @simplexml_load_string($raw);
        if ($xml === false) {
            return [];
        }
        $xml->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $out = [];
        foreach ($xml->xpath('//m:si') as $si) {
            if (isset($si->t)) {
                $out[] = (string)$si->t;
            } else {
                $text = '';
                foreach ($si->xpath('.//m:t') as $t) {
                    $text .= (string)$t;
                }
                $out[] = $text;
            }
        }
        return $out;
    }

    private static function resolveFirstSheetPath(ZipArchive $zip): ?string
    {
        $wb = $zip->getFromName('xl/workbook.xml');
        if ($wb === false) {
            return null;
        }
        $xml = @simplexml_load_string($wb);
        if ($xml === false) {
            return 'xl/worksheets/sheet1.xml';
        }
        $xml->registerXPathNamespace('m', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
        $xml->registerXPathNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $sheets = $xml->xpath('//m:sheets/m:sheet');
        if (!$sheets || !isset($sheets[0])) {
            return 'xl/worksheets/sheet1.xml';
        }
        $first = $sheets[0];
        $ns = $first->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
        $rid = $ns && isset($ns['id']) ? (string)$ns['id'] : '';
        if ($rid === '') {
            return 'xl/worksheets/sheet1.xml';
        }
        $rels = $zip->getFromName('xl/_rels/workbook.xml.rels');
        if ($rels === false) {
            return 'xl/worksheets/sheet1.xml';
        }
        $relsXml = @simplexml_load_string($rels);
        if ($relsXml === false) {
            return 'xl/worksheets/sheet1.xml';
        }
        foreach ($relsXml->Relationship as $rel) {
            if ((string)$rel['Id'] === $rid) {
                $target = (string)$rel['Target'];
                $target = str_replace('\\', '/', $target);
                if (strpos($target, 'xl/') === 0) {
                    return $target;
                }
                return 'xl/' . ltrim($target, '/');
            }
        }
        return 'xl/worksheets/sheet1.xml';
    }

    private static function colLettersToIndex(string $letters): int
    {
        $letters = strtoupper($letters);
        $n = 0;
        $len = strlen($letters);
        for ($i = 0; $i < $len; $i++) {
            $n = $n * 26 + (ord($letters[$i]) - 64);
        }
        return $n - 1;
    }

    private static function cellValue(SimpleXMLElement $c, array $shared): string
    {
        $t = (string)$c['t'];
        if ($t === 'inlineStr' && isset($c->is->t)) {
            return (string)$c->is->t;
        }
        if (!isset($c->v)) {
            return '';
        }
        $v = (string)$c->v;
        if ($t === 's') {
            return $shared[(int)$v] ?? '';
        }
        return $v;
    }
}
