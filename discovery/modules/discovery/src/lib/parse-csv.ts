export type ParsedCsvTable = {
  headers: string[];
  rows: Record<string, string>[];
  dataRowCount: number;
  skippedBlankRows: number;
};

/** Normalize header labels: lowercase, trim, collapse whitespace to underscores. */
export function normalizeCsvHeader(header: string): string {
  return header
    .trim()
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * RFC 4180–style CSV parser (quoted fields, escaped quotes, commas in quotes).
 * Returns row objects keyed by normalized headers.
 */
export function parseCsvContent(content: string): ParsedCsvTable {
  const text = content.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let skippedBlankRows = 0;

  const pushField = () => {
    row.push(field);
    field = '';
  };

  const pushRow = () => {
    const isBlank = row.every((cell) => !cell.trim());
    if (isBlank) {
      skippedBlankRows++;
    } else {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      pushField();
      continue;
    }

    if (char === '\r') {
      if (next === '\n') i++;
      pushField();
      pushRow();
      continue;
    }

    if (char === '\n') {
      pushField();
      pushRow();
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  if (rows.length === 0) {
    return { headers: [], rows: [], dataRowCount: 0, skippedBlankRows };
  }

  const rawHeaders = rows[0].map((h) => h.trim());
  const headers = rawHeaders.map(normalizeCsvHeader);
  const dataRows: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r];
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = (cols[idx] ?? '').trim();
    });
    dataRows.push(record);
  }

  return {
    headers: headers.filter(Boolean),
    rows: dataRows,
    dataRowCount: dataRows.length,
    skippedBlankRows,
  };
}

export const CSV_TEMPLATE_HEADERS = [
  'name',
  'industry',
  'website',
  'phone',
  'email',
  'city',
  'country',
  'source_url',
  'google_maps_url',
  'facebook_url',
  'instagram_url',
] as const;

export function buildCsvTemplate(): string {
  const header = CSV_TEMPLATE_HEADERS.join(',');
  const example = [
    'Acme Dental Studio',
    'dentist',
    'https://acmedental.example',
    '+1 555 0100',
    'hello@acmedental.example',
    'Austin',
    'United States',
    '',
    'https://maps.google.com/?cid=123',
    'https://facebook.com/acmedental',
    'https://instagram.com/acmedental',
  ]
    .map((v) => (v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v))
    .join(',');
  return `${header}\n${example}\n`;
}
