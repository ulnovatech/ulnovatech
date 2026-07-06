import { platformSettings } from '@agency/settings';
import type { DiscoveredBusiness, DiscoverySearchParams } from '../types';
import type { PlacesTextSearchResult } from './places-types';

export function parseCityFromAddressComponents(
  components?: Array<{ longText?: string; types?: string[] }>,
): string | undefined {
  if (!components) return undefined;
  const locality = components.find(
    (c) => c.types?.includes('locality') || c.types?.includes('postal_town'),
  );
  return locality?.longText;
}

export function normalizePlacesExternalId(placeId: string): string {
  return placeId.startsWith('places/') ? placeId : `places/${placeId}`;
}

export function placesIdFromExternalId(externalId: string | undefined): string | undefined {
  if (!externalId) return undefined;
  if (externalId.startsWith('places/')) return externalId.slice('places/'.length);
  return externalId;
}

export function placeSearchResultToDiscoveredBusiness(
  place: PlacesTextSearchResult,
  params: DiscoverySearchParams,
): DiscoveredBusiness | null {
  if (!place.id?.trim()) return null;
  const name = place.displayName?.text?.trim();
  if (!name || name.length < 2) return null;

  const placesId = place.id.replace(/^places\//, '');
  const city =
    parseCityFromAddressComponents(place.addressComponents) ??
    (platformSettings.isAllCities(params.city) ? undefined : params.city);

  return {
    name,
    industry: params.industry,
    country: params.country,
    city,
    website: place.websiteUri || undefined,
    phone: place.nationalPhoneNumber || undefined,
    source: 'google_maps',
    googleMapsUrl: place.googleMapsUri,
    rating: place.rating,
    reviewCount: place.userRatingCount,
    externalId: normalizePlacesExternalId(place.id),
    metadata: {
      formattedAddress: place.formattedAddress,
      businessStatus: place.businessStatus,
      placesId,
      placesVerified: true,
      discoverSource: 'places_text_search',
    },
  };
}
