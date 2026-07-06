import { platformSettings } from '@agency/settings';
import fs from 'fs';
import path from 'path';
import { buildCsvTemplate, parseCsvContent } from './parse-csv';
import { hasRequiredNameColumn, mapCsvRowsToCandidates } from './map-csv-row';
import type { DiscoveredBusiness, DiscoverySearchParams } from '../providers/types';

export const CSV_MAX_BYTES = 5 * 1024 * 1024;
export const CSV_MAX_ROWS = 10_000;

export type CsvImportFileInfo = {
  configured: boolean;
  path: string;
  exists: boolean;
  rowCount: number;
  headers: string[];
  lastModified: string | null;
  sizeBytes: number | null;
  valid: boolean;
  validationMessage?: string;
};

export type CsvUploadResult = {
  path: string;
  rowCount: number;
  headers: string[];
  sizeBytes: number;
};

export type CsvParsePreview = {
  headers: string[];
  rowCount: number;
  skippedBlankRows: number;
  sampleRows: Record<string, string>[];
  valid: boolean;
  validationMessage?: string;
};

function resolvePath(): string {
  return platformSettings.resolveCsvPath();
}

export function readCsvFileContent(filePath?: string): string | null {
  const target = filePath ?? resolvePath();
  if (!fs.existsSync(target)) return null;
  return fs.readFileSync(target, 'utf-8');
}

export function previewCsvContent(content: string): CsvParsePreview {
  const parsed = parseCsvContent(content);
  const valid = parsed.headers.length > 0 && hasRequiredNameColumn(parsed.headers);
  let validationMessage: string | undefined;
  if (parsed.headers.length === 0) {
    validationMessage = 'CSV must include a header row.';
  } else if (!hasRequiredNameColumn(parsed.headers)) {
    validationMessage = 'CSV must include a name column (name, business, or company).';
  } else if (parsed.dataRowCount === 0) {
    validationMessage = 'CSV has headers but no data rows.';
  } else if (parsed.dataRowCount > CSV_MAX_ROWS) {
    validationMessage = `CSV exceeds maximum of ${CSV_MAX_ROWS} data rows.`;
  }

  return {
    headers: parsed.headers,
    rowCount: parsed.dataRowCount,
    skippedBlankRows: parsed.skippedBlankRows,
    sampleRows: parsed.rows.slice(0, 3),
    valid: valid && parsed.dataRowCount > 0 && parsed.dataRowCount <= CSV_MAX_ROWS,
    validationMessage,
  };
}

export function validateCsvForImport(content: string): { ok: true } | { ok: false; error: string } {
  const bytes = Buffer.byteLength(content, 'utf-8');
  if (bytes > CSV_MAX_BYTES) {
    return { ok: false, error: `File exceeds ${CSV_MAX_BYTES / (1024 * 1024)}MB limit.` };
  }
  const preview = previewCsvContent(content);
  if (!preview.valid) {
    return { ok: false, error: preview.validationMessage ?? 'Invalid CSV.' };
  }
  return { ok: true };
}

export function getCsvImportFileInfo(): CsvImportFileInfo {
  const filePath = resolvePath();
  const exists = fs.existsSync(filePath);

  if (!exists) {
    return {
      configured: false,
      path: filePath,
      exists: false,
      rowCount: 0,
      headers: [],
      lastModified: null,
      sizeBytes: null,
      valid: false,
      validationMessage: 'No CSV file at configured path. Upload a file to enable CSV import.',
    };
  }

  const stat = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const preview = previewCsvContent(content);

  return {
    configured: preview.valid,
    path: filePath,
    exists: true,
    rowCount: preview.rowCount,
    headers: preview.headers,
    lastModified: stat.mtime.toISOString(),
    sizeBytes: stat.size,
    valid: preview.valid,
    validationMessage: preview.validationMessage,
  };
}

export function saveCsvImportFile(content: string): CsvUploadResult {
  const validation = validateCsvForImport(content);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const filePath = resolvePath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);

  const preview = previewCsvContent(content);
  const stat = fs.statSync(filePath);

  return {
    path: filePath,
    rowCount: preview.rowCount,
    headers: preview.headers,
    sizeBytes: stat.size,
  };
}

export function loadCsvCandidates(
  params: DiscoverySearchParams,
  filePath?: string,
): DiscoveredBusiness[] {
  const content = readCsvFileContent(filePath);
  if (!content) return [];

  const parsed = parseCsvContent(content);
  if (parsed.dataRowCount === 0) return [];

  const { candidates } = mapCsvRowsToCandidates(
    parsed.rows,
    params,
    (city) => platformSettings.isAllCities(city),
  );

  return candidates;
}

export function getCsvTemplateContent(): string {
  return buildCsvTemplate();
}
