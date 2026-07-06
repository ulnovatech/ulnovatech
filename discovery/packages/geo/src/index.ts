export { COUNTRIES } from './countries';
export {
  CITIES_BY_COUNTRY,
  citiesForCountry,
  specificCitiesForCountry,
  isAllCities,
} from './cities';
export { ALL_CITIES } from './constants';
export { COUNTRY_ISO2, countryToIso2 } from './country-codes';

export function filterOptions(options: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter((o) => o.toLowerCase().includes(q));
}
