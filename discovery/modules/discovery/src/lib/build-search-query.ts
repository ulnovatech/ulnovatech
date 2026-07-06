import { allCitiesMaxQueriesBoost, allCitiesMaxQueriesStandard } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { DiscoverySearchParams } from '../providers/types';
import { expandIndustryTerms } from './industry-search-terms';

function allCitiesQueryCap(mode = platformSettings.getAcquisitionMode()): number {
  return mode === 'boost' ? allCitiesMaxQueriesBoost() : allCitiesMaxQueriesStandard();
}

export function buildTextQuery(params: DiscoverySearchParams, term?: string): string {
  const industry = (term ?? params.industry).trim();
  if (platformSettings.isAllCities(params.city)) {
    return `${industry} in ${params.country}`;
  }
  return `${industry} in ${params.city}, ${params.country}`;
}

export function buildCitySearchQueries(params: DiscoverySearchParams): string[] {
  const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
  const synonymCap = mode === 'boost' ? 2 : 1;
  const terms = expandIndustryTerms(params.industry, synonymCap);

  if (!platformSettings.isAllCities(params.city)) {
    if (terms.length === 1) return [buildTextQuery(params)];
    return terms.map((term) => buildTextQuery(params, term));
  }

  const cities = platformSettings.specificCitiesForCountry(params.country);
  if (cities.length === 0) {
    return terms.length === 1 ? [buildTextQuery(params)] : terms.map((t) => buildTextQuery(params, t));
  }

  const cap = allCitiesQueryCap(mode);
  return cities.slice(0, cap).map((city, index) => {
    const term = terms[index % terms.length] ?? params.industry.trim();
    return `${term} in ${city}, ${params.country}`;
  });
}
