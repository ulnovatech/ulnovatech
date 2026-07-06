import { platformSettings } from '@agency/settings';
import type { DiscoveredBusiness, DiscoverySearchParams } from '../types';
import type {
  MetaGraphPageResult,
  MetaGraphPlaceResult,
  MetaGraphSearchType,
} from './meta-graph-types';

function locationCity(location?: { city?: string }): string | undefined {
  const city = location?.city?.trim();
  return city || undefined;
}

function locationCountry(
  location: { country?: string } | undefined,
  fallback: string,
): string | undefined {
  const country = location?.country?.trim();
  return country || fallback;
}

function facebookPageUrl(page: MetaGraphPageResult): string {
  if (page.link?.trim()) return page.link.trim();
  return `https://www.facebook.com/${page.id}`;
}

function instagramProfileUrl(account: { username?: string; id: string }): string {
  if (account.username?.trim()) {
    return `https://www.instagram.com/${account.username.trim().replace(/^@/, '')}/`;
  }
  return `https://www.instagram.com/${account.id}`;
}

export function mapMetaPageToDiscoveredBusiness(
  page: MetaGraphPageResult,
  params: DiscoverySearchParams,
  query: string,
): DiscoveredBusiness[] {
  const name = page.name?.trim();
  if (!name || name.length < 2) return [];

  const results: DiscoveredBusiness[] = [];
  const city =
    locationCity(page.location) ??
    (params.city && !platformSettings.isAllCities(params.city) ? params.city : undefined);
  const country = locationCountry(page.location, params.country);

  results.push({
    name,
    industry: page.category?.trim() || params.industry,
    website: page.website?.trim() || undefined,
    phone: page.phone?.trim() || undefined,
    city,
    country,
    source: 'facebook',
    sourceUrl: facebookPageUrl(page),
    externalId: `meta:page:${page.id}`,
    facebookUrl: facebookPageUrl(page),
    instagramUrl: page.instagram_business_account
      ? instagramProfileUrl(page.instagram_business_account)
      : undefined,
    metadata: {
      metaGraphQuery: query,
      metaGraphType: 'page' satisfies MetaGraphSearchType,
      metaPageId: page.id,
      fanCount: page.fan_count,
      category: page.category,
      instagramBusinessId: page.instagram_business_account?.id,
    },
  });

  const ig = page.instagram_business_account;
  if (ig?.id) {
    const igName = ig.name?.trim() || ig.username?.trim() || name;
    results.push({
      name: igName,
      industry: page.category?.trim() || params.industry,
      website: ig.website?.trim() || page.website?.trim() || undefined,
      phone: page.phone?.trim() || undefined,
      city,
      country,
      source: 'instagram',
      sourceUrl: instagramProfileUrl(ig),
      externalId: `meta:ig:${ig.id}`,
      facebookUrl: facebookPageUrl(page),
      instagramUrl: instagramProfileUrl(ig),
      metadata: {
        metaGraphQuery: query,
        metaGraphType: 'page',
        metaPageId: page.id,
        instagramBusinessId: ig.id,
        linkedFacebookPageId: page.id,
      },
    });
  }

  return results;
}

export function mapMetaPlaceToDiscoveredBusiness(
  place: MetaGraphPlaceResult,
  params: DiscoverySearchParams,
  query: string,
): DiscoveredBusiness | null {
  const name = place.name?.trim();
  if (!name || name.length < 2) return null;

  const city =
    locationCity(place.location) ??
    (params.city && !platformSettings.isAllCities(params.city) ? params.city : undefined);
  const country = locationCountry(place.location, params.country);
  const url = place.link?.trim() || `https://www.facebook.com/${place.id}`;

  return {
    name,
    industry: place.category?.trim() || params.industry,
    website: place.website?.trim() || undefined,
    phone: place.phone?.trim() || undefined,
    city,
    country,
    source: 'facebook',
    sourceUrl: url,
    externalId: `meta:place:${place.id}`,
    facebookUrl: url,
    metadata: {
      metaGraphQuery: query,
      metaGraphType: 'place' satisfies MetaGraphSearchType,
      metaPlaceId: place.id,
      category: place.category,
    },
  };
}
