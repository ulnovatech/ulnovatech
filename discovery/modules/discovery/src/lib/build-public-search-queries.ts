import { prospectFocusQueryRatio, prospectQueryRatio } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { DiscoverySearchParams } from '../providers/types';
import { buildProspectSearchQueries } from './build-prospect-search-queries';
import {
  allCitiesFanOut,
  dedupeQueries,
  locationPhrase,
} from './discovery-query-helpers';
import { expandIndustryTerms } from './industry-search-terms';
import { getRunSearchQueryLimit } from './run-profile';

export { SEARCH_NEGATIVE_KEYWORDS } from './discovery-query-helpers';

function buildGeneralPublicQueries(
  params: DiscoverySearchParams,
  terms: string[],
  maxQueries: number,
): string[] {
  const location = locationPhrase(params);
  const queries: string[] = [];

  for (const term of terms) {
    queries.push(`${term} ${location}`);
    if (!platformSettings.isAllCities(params.city)) {
      queries.push(`${term} near ${params.city}`);
      queries.push(`"${term}" "${params.city}" contact`);
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

  if (maxQueries > 4) {
    const primary = terms[0] ?? params.industry.trim();
    queries.push(`"${primary}" "${params.country}" contact`);
    queries.push(`need web designer ${location}`);
  }

  if (maxQueries > 8) {
    queries.push(`small business ${location} ${terms[0] ?? params.industry}`);
  }

  return dedupeQueries(queries, maxQueries);
}

export function buildPublicSearchQueries(
  params: DiscoverySearchParams,
  maxQueries = getRunSearchQueryLimit(),
  options?: { prospectRatio?: number; synonymTerms?: number },
): string[] {
  const ratio =
    options?.prospectRatio ??
    (params.prospectFocus ? prospectFocusQueryRatio() : prospectQueryRatio());
  const synonymTerms = options?.synonymTerms ?? (params.prospectFocus ? 3 : 2);
  const prospectMax = Math.max(1, Math.floor(maxQueries * ratio));
  const generalMax = Math.max(1, maxQueries - prospectMax);

  const terms = expandIndustryTerms(params.industry, synonymTerms);

  const prospect = buildProspectSearchQueries({ params, terms, maxQueries: prospectMax });
  const general = buildGeneralPublicQueries(params, terms, generalMax);

  return dedupeQueries([...prospect, ...general], maxQueries);
}
