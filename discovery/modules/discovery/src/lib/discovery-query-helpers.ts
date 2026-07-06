import {
  allCitiesMaxQueriesBoost,
  allCitiesMaxQueriesStandard,
} from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { DiscoverySearchParams } from '../providers/types';

/** Negative keywords appended to web search queries to reduce noise. */
export const SEARCH_NEGATIVE_KEYWORDS = '-jobs -vacancy -course -training -wikipedia';

export function locationPhrase(params: DiscoverySearchParams): string {
  if (platformSettings.isAllCities(params.city)) return params.country;
  return `${params.city}, ${params.country}`;
}

export function primaryCityLabel(params: DiscoverySearchParams): string | undefined {
  if (!platformSettings.isAllCities(params.city)) return params.city.trim();
  return platformSettings.specificCitiesForCountry(params.country)[0];
}

export function allCitiesFanOut(
  params: DiscoverySearchParams,
  mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode(),
): string[] {
  const cap =
    mode === 'boost' ? allCitiesMaxQueriesBoost() : allCitiesMaxQueriesStandard();
  return platformSettings.specificCitiesForCountry(params.country).slice(0, cap);
}

export function dedupeQueries(queries: string[], max?: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const key = q.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(q.trim());
    if (max != null && out.length >= max) break;
  }
  return out;
}
