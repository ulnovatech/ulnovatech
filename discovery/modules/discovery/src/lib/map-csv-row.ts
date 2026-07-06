import type { DiscoveredBusiness, DiscoverySearchParams } from '../providers/types';

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'business', 'business_name', 'company', 'company_name', 'businessname'],
  industry: ['industry', 'category', 'sector', 'vertical', 'niche'],
  website: ['website', 'url', 'site', 'web', 'homepage', 'domain'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'phone_number'],
  email: ['email', 'e_mail', 'email_address'],
  city: ['city', 'town', 'locality'],
  country: ['country', 'nation'],
  source_url: ['source_url', 'listing_url', 'profile_url', 'source'],
  google_maps_url: ['google_maps_url', 'maps_url', 'gmb_url', 'google_map_url'],
  facebook_url: ['facebook_url', 'facebook', 'fb_url', 'fb'],
  instagram_url: ['instagram_url', 'instagram', 'ig_url', 'ig'],
};

function pickField(row: Record<string, string>, field: keyof typeof HEADER_ALIASES): string {
  for (const alias of HEADER_ALIASES[field]) {
    const value = row[alias];
    if (value?.trim()) return value.trim();
  }
  return '';
}

function includesLoose(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  return h.includes(n) || n.includes(h);
}

export function rowMatchesRunFilters(
  row: Record<string, string>,
  params: DiscoverySearchParams,
  isAllCities: (city: string) => boolean,
): boolean {
  const rowIndustry = pickField(row, 'industry');
  if (
    rowIndustry &&
    !includesLoose(rowIndustry, params.industry) &&
    !includesLoose(params.industry, rowIndustry)
  ) {
    return false;
  }

  const rowCountry = pickField(row, 'country') || params.country;
  if (pickField(row, 'country') && pickField(row, 'country').toLowerCase() !== params.country.toLowerCase()) {
    return false;
  }

  const rowCity = pickField(row, 'city') || (isAllCities(params.city) ? '' : params.city);
  if (
    !isAllCities(params.city) &&
    pickField(row, 'city') &&
    pickField(row, 'city').toLowerCase() !== params.city.toLowerCase()
  ) {
    return false;
  }

  void rowCountry;
  void rowCity;
  return true;
}

export function mapCsvRowToCandidate(
  row: Record<string, string>,
  params: DiscoverySearchParams,
  isAllCities: (city: string) => boolean,
): DiscoveredBusiness | null {
  const name = pickField(row, 'name');
  if (!name) return null;

  const rowIndustry = pickField(row, 'industry');
  const rowCountry = pickField(row, 'country') || params.country;
  const rowCity = pickField(row, 'city') || (isAllCities(params.city) ? undefined : params.city);

  return {
    name,
    industry: rowIndustry || params.industry,
    website: pickField(row, 'website'),
    phone: pickField(row, 'phone'),
    email: pickField(row, 'email'),
    city: rowCity || undefined,
    country: rowCountry,
    source: 'csv_import',
    sourceUrl: pickField(row, 'source_url') || undefined,
    googleMapsUrl: pickField(row, 'google_maps_url') || undefined,
    facebookUrl: pickField(row, 'facebook_url') || undefined,
    instagramUrl: pickField(row, 'instagram_url') || undefined,
  };
}

export function mapCsvRowsToCandidates(
  rows: Record<string, string>[],
  params: DiscoverySearchParams,
  isAllCities: (city: string) => boolean,
): { candidates: DiscoveredBusiness[]; filteredOut: number; skippedNoName: number } {
  const candidates: DiscoveredBusiness[] = [];
  let filteredOut = 0;
  let skippedNoName = 0;

  for (const row of rows) {
    if (!rowMatchesRunFilters(row, params, isAllCities)) {
      filteredOut++;
      continue;
    }
    const candidate = mapCsvRowToCandidate(row, params, isAllCities);
    if (!candidate) {
      skippedNoName++;
      continue;
    }
    candidates.push(candidate);
  }

  return { candidates, filteredOut, skippedNoName };
}

export function hasRequiredNameColumn(headers: string[]): boolean {
  return HEADER_ALIASES.name.some((alias) => headers.includes(alias));
}
