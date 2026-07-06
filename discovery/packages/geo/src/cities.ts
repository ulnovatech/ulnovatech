import { ALL_CITIES } from './constants';
import { CITIES_BY_COUNTRY_GENERATED } from './cities.generated';

const unitedStatesCities = CITIES_BY_COUNTRY_GENERATED['United States'] ?? [];

/** Major cities by country for targeted discovery (top 15 by population from GeoNames) */
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  ...CITIES_BY_COUNTRY_GENERATED,
  USA: [...unitedStatesCities],
};

/** Cities used for discovery when "All cities" is selected (excludes ALL_CITIES label) */
export function specificCitiesForCountry(country: string): string[] {
  return CITIES_BY_COUNTRY[country] ?? [];
}

export function citiesForCountry(country: string): string[] {
  const specific = specificCitiesForCountry(country);
  return [ALL_CITIES, ...specific];
}

export function isAllCities(city: string): boolean {
  return city.trim().toLowerCase() === ALL_CITIES.toLowerCase();
}
