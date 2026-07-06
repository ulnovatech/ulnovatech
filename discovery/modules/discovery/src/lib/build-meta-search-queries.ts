import { platformSettings } from '@agency/settings';
import type { DiscoverySearchParams } from '../providers/types';
import { allCitiesFanOut, dedupeQueries, locationPhrase } from './discovery-query-helpers';
import { expandIndustryTerms } from './industry-search-terms';
import { getMetaGraphQueryLimit } from './run-profile';

export function buildMetaSearchQueries(
  params: DiscoverySearchParams,
  maxQueries = getMetaGraphQueryLimit(),
): string[] {
  const terms = expandIndustryTerms(params.industry, 2);
  const location = locationPhrase(params);
  const queries: string[] = [];

  for (const term of terms) {
    queries.push(`${term} ${location}`);
    if (!platformSettings.isAllCities(params.city)) {
      queries.push(`${term} near ${params.city}`);
    }
  }

  if (platformSettings.isAllCities(params.city)) {
    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    const cities = allCitiesFanOut(params, mode);
    const primary = terms[0] ?? params.industry.trim();
    for (const city of cities) {
      queries.push(`${primary} in ${city}, ${params.country}`);
    }
  }

  if (maxQueries > 3) {
    const primary = terms[0] ?? params.industry.trim();
    queries.push(`${primary} business ${location}`);
  }

  return dedupeQueries(queries, maxQueries);
}
