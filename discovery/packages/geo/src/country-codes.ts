import { COUNTRY_ISO2_GENERATED } from './country-codes.generated';

/** ISO 3166-1 alpha-2 for Google Places region bias and search geo targeting */
export const COUNTRY_ISO2: Record<string, string> = {
  ...COUNTRY_ISO2_GENERATED,
  USA: 'US',
};

export function countryToIso2(country: string): string | undefined {
  return COUNTRY_ISO2[country];
}
