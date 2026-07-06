import { platformSettings } from '@agency/settings';
import type { DiscoverySearchParams } from '../providers/types';
import {
  dedupeQueries,
  locationPhrase,
  primaryCityLabel,
  SEARCH_NEGATIVE_KEYWORDS,
} from './discovery-query-helpers';

export type ProspectQueryOptions = {
  params: DiscoverySearchParams;
  terms: string[];
  maxQueries: number;
};

/**
 * ICP-oriented queries targeting businesses likely to need a website
 * (social presence, contact gaps, booking without owned site).
 */
export function buildProspectSearchQueries(opts: ProspectQueryOptions): string[] {
  const { params, terms, maxQueries } = opts;
  if (maxQueries <= 0 || terms.length === 0) return [];

  const city = primaryCityLabel(params);
  const country = params.country.trim();
  const location = locationPhrase(params);
  const queries: string[] = [];
  const negatives = SEARCH_NEGATIVE_KEYWORDS;

  for (const term of terms) {
    if (queries.length >= maxQueries) break;

    if (city) {
      queries.push(`site:facebook.com ${term} ${city} ${negatives}`);
      queries.push(`"${term}" "${city}" contact ${negatives}`);
      queries.push(`"${term}" "${city}" no website ${negatives}`);
      queries.push(`"${term}" "${city}" book appointment ${negatives}`);
    } else {
      queries.push(`site:facebook.com ${term} ${country} ${negatives}`);
      queries.push(`"${term}" "${country}" contact ${negatives}`);
    }
  }

  if (queries.length < maxQueries && city) {
    queries.push(`"${terms[0]}" "${city}" without website ${negatives}`);
  }

  if (queries.length < maxQueries) {
    queries.push(`looking for website ${location} ${terms[0]} ${negatives}`);
  }

  return dedupeQueries(queries, maxQueries);
}
