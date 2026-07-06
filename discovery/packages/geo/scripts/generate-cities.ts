/**
 * Downloads GeoNames open data and generates cities.generated.ts + country-codes.generated.ts.
 * Run: pnpm geo:generate-cities
 */
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COUNTRIES } from '../src/countries';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(PKG_ROOT, 'data');
const CACHE_DIR = path.join(DATA_DIR, 'cache');
const OVERRIDES_PATH = path.join(DATA_DIR, 'country-name-overrides.json');

const GEONAMES_BASE = 'https://download.geonames.org/export/dump';
const TOP_N = 15;

const POPULATED_FEATURE_CODES = new Set([
  'PPL',
  'PPLA',
  'PPLA2',
  'PPLA3',
  'PPLA4',
  'PPLC',
  'PPLG',
  'PPLR',
  'PPLS',
  'STLMT',
]);

type CityRow = {
  name: string;
  countryCode: string;
  population: number;
};

type CountryInfoRow = {
  iso2: string;
  name: string;
};

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function download(url: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    console.log(`  cache hit: ${path.basename(dest)}`);
    return;
  }
  console.log(`  downloading: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
}

function extractZipTxt(zipPath: string, txtName: string): string {
  const zip = new AdmZip(zipPath);
  const entry = zip.getEntry(txtName);
  if (!entry) {
    throw new Error(`Missing ${txtName} in ${zipPath}`);
  }
  return entry.getData().toString('utf8');
}

function parseCountryInfo(content: string): CountryInfoRow[] {
  const rows: CountryInfoRow[] = [];
  for (const line of content.split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const parts = line.split('\t');
    if (parts.length < 5) continue;
    const iso2 = parts[0]?.trim();
    const name = parts[4]?.trim();
    if (!iso2 || !name) continue;
    rows.push({ iso2, name });
  }
  return rows;
}

function parseCitiesFile(content: string): CityRow[] {
  const rows: CityRow[] = [];
  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 15) continue;

    const featureClass = parts[6]?.trim();
    const featureCode = parts[7]?.trim();
    if (featureClass !== 'P' || !featureCode || !POPULATED_FEATURE_CODES.has(featureCode)) {
      continue;
    }

    const asciiName = parts[2]?.trim() || parts[1]?.trim();
    const countryCode = parts[8]?.trim();
    const population = parseInt(parts[14] ?? '0', 10) || 0;
    if (!asciiName || !countryCode) continue;

    rows.push({ name: titleCaseCity(asciiName), countryCode, population });
  }
  return rows;
}

function titleCaseCity(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      if (word === word.toUpperCase() && word.length <= 4) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function buildIso2Lookup(countryInfo: CountryInfoRow[]): Map<string, string> {
  const byNormalized = new Map<string, string>();
  for (const row of countryInfo) {
    byNormalized.set(normalizeName(row.name), row.iso2);
  }
  return byNormalized;
}

function resolveIso2(
  country: string,
  overrides: Record<string, string>,
  byNormalized: Map<string, string>,
): string | undefined {
  if (overrides[country]) return overrides[country];
  const direct = byNormalized.get(normalizeName(country));
  if (direct) return direct;

  const aliases: Record<string, string> = {
    'united states of america': 'US',
    'great britain': 'GB',
    'korea republic of': 'KR',
    'korea democratic people s republic of': 'KP',
    'russian federation': 'RU',
    'viet nam': 'VN',
    'lao people s democratic republic': 'LA',
    'syrian arab republic': 'SY',
    'bolivia plurinational state of': 'BO',
    'venezuela bolivarian republic of': 'VE',
    'iran islamic republic of': 'IR',
    'tanzania united republic of': 'TZ',
    'moldova republic of': 'MD',
    'micronesia federated states of': 'FM',
    'congo democratic republic of the': 'CD',
    'congo republic of the': 'CG',
    'cote d ivoire': 'CI',
    'cabo verde': 'CV',
    'eswatini': 'SZ',
    'north macedonia': 'MK',
    'timor leste': 'TL',
    'holy see vatican city state': 'VA',
    'palestinian territory': 'PS',
    'state of palestine': 'PS',
  };

  const normalized = normalizeName(country);
  if (aliases[normalized]) return aliases[normalized];

  for (const [key, iso2] of byNormalized.entries()) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return iso2;
    }
  }

  return undefined;
}

function topCitiesForCountry(cities: CityRow[], iso2: string): string[] {
  const seen = new Set<string>();
  const ranked = cities
    .filter((c) => c.countryCode === iso2)
    .sort((a, b) => b.population - a.population);

  const result: string[] = [];
  for (const city of ranked) {
    const key = city.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(city.name);
    if (result.length >= TOP_N) break;
  }
  return result;
}

function mergeCityLists(primary: string[], secondary: string[]): string[] {
  const seen = new Set(primary.map((c) => c.toLowerCase()));
  const merged = [...primary];
  for (const city of secondary) {
    const key = city.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(city);
    if (merged.length >= TOP_N) break;
  }
  return merged;
}

function serializeCitiesRecord(name: string, record: Record<string, string[]>, indent = 2): string {
  const pad = ' '.repeat(indent);
  const lines = Object.entries(record)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const cityLines = value.map((c) => `${pad}  ${JSON.stringify(c)},`).join('\n');
      return `${pad}${JSON.stringify(key)}: [\n${cityLines}\n${pad}],`;
    });
  return `export const ${name}: Record<string, string[]> = {\n${lines.join('\n')}\n};\n`;
}

function serializeIso2Record(name: string, record: Record<string, string>, indent = 2): string {
  const pad = ' '.repeat(indent);
  const lines = Object.entries(record)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${pad}${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  return `export const ${name}: Record<string, string> = {\n${lines.join('\n')}\n};\n`;
}

async function main() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  const countryInfoPath = path.join(CACHE_DIR, 'countryInfo.txt');
  const cities15Zip = path.join(CACHE_DIR, 'cities15000.zip');
  const cities5Zip = path.join(CACHE_DIR, 'cities5000.zip');

  await download(`${GEONAMES_BASE}/countryInfo.txt`, countryInfoPath);
  await download(`${GEONAMES_BASE}/cities15000.zip`, cities15Zip);
  await download(`${GEONAMES_BASE}/cities5000.zip`, cities5Zip);

  const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8')) as Record<string, string>;
  const countryInfo = parseCountryInfo(fs.readFileSync(countryInfoPath, 'utf8'));
  const byNormalized = buildIso2Lookup(countryInfo);

  const cities15 = parseCitiesFile(extractZipTxt(cities15Zip, 'cities15000.txt'));
  const cities5 = parseCitiesFile(extractZipTxt(cities5Zip, 'cities5000.txt'));

  const citiesByCountry: Record<string, string[]> = {};
  const countryIso2: Record<string, string> = {};
  const missingIso: string[] = [];
  const sparseCities: string[] = [];

  for (const country of COUNTRIES) {
    const iso2 = resolveIso2(country, overrides, byNormalized);
    if (!iso2) {
      missingIso.push(country);
      citiesByCountry[country] = [];
      continue;
    }

    countryIso2[country] = iso2;
    const from15 = topCitiesForCountry(cities15, iso2);
    const from5 = topCitiesForCountry(cities5, iso2);
    const cities = mergeCityLists(from15, from5);
    citiesByCountry[country] = cities;

    if (cities.length < TOP_N) {
      sparseCities.push(`${country} (${cities.length})`);
    }
  }

  const generatedAt = new Date().toISOString();
  const header = `/** Auto-generated by packages/geo/scripts/generate-cities.ts — do not edit manually */\n/** Generated at: ${generatedAt} */\n\n`;

  fs.writeFileSync(
    path.join(PKG_ROOT, 'src', 'cities.generated.ts'),
    header + serializeCitiesRecord('CITIES_BY_COUNTRY_GENERATED', citiesByCountry),
    'utf8',
  );

  fs.writeFileSync(
    path.join(PKG_ROOT, 'src', 'country-codes.generated.ts'),
    header + serializeIso2Record('COUNTRY_ISO2_GENERATED', countryIso2),
    'utf8',
  );

  console.log(`Generated cities for ${COUNTRIES.length} countries.`);
  console.log(`ISO2 mapped: ${Object.keys(countryIso2).length}`);
  if (missingIso.length) {
    console.warn(`Missing ISO2 (${missingIso.length}):`, missingIso.join(', '));
  }
  if (sparseCities.length) {
    console.warn(`Fewer than ${TOP_N} cities (${sparseCities.length}):`, sparseCities.slice(0, 20).join(', '));
    if (sparseCities.length > 20) console.warn(`  ... and ${sparseCities.length - 20} more`);
  }

  const uganda = citiesByCountry.Uganda ?? [];
  console.log(`Uganda cities (${uganda.length}):`, uganda.join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
