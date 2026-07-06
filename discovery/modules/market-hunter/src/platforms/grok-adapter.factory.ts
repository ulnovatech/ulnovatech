import type { MarketHunterPlatformKey } from '../types';
import { researchListingReviews, researchPlatformListings } from '../research/grok.client';
import type { FetchListingsParams, PlatformAdapter } from './base.adapter';
import { getAdapterScanContext } from './adapter-context';
import { getPlatformConfig } from './platform-config';
import { registerPlatformAdapter } from './registry';

export type GrokMarketplaceAdapterOptions = {
  platformKey: MarketHunterPlatformKey;
  allowedDomain: string;
  /** Build review page URL when only an id slug is passed. */
  resolveReviewUrl?: (listingId: string, baseUrl: string) => string;
};

function defaultReviewUrl(listingId: string, baseUrl: string): string {
  if (listingId.startsWith('http')) return listingId;
  return `${baseUrl.replace(/\/$/, '')}/${listingId}`;
}

export function createGrokMarketplaceAdapter(opts: GrokMarketplaceAdapterOptions): PlatformAdapter {
  const config = getPlatformConfig(opts.platformKey);
  const resolveReviewUrl = opts.resolveReviewUrl ?? defaultReviewUrl;

  const adapter: PlatformAdapter = {
    platformKey: opts.platformKey,
    platformName: config.label,
    role: config.role,

    async fetchListings(params: FetchListingsParams) {
      const ctx = getAdapterScanContext();
      return researchPlatformListings(
        opts.platformKey,
        {
          platform: config.label,
          platformBaseUrl: config.baseUrl,
          category: params.category,
          limit: params.limit,
          allowedDomain: opts.allowedDomain,
        },
        {
          scanId: ctx.scanId,
          spendGuard: ctx.spendGuard,
          operation: `${opts.platformKey}_listings_${params.category}`,
        },
      );
    },

    async getReviews(listingId: string) {
      const ctx = getAdapterScanContext();
      const url = resolveReviewUrl(listingId, config.baseUrl);
      return researchListingReviews(
        {
          platform: config.label,
          listingUrl: url,
          limit: 10,
        },
        {
          scanId: ctx.scanId,
          spendGuard: ctx.spendGuard,
          operation: `${opts.platformKey}_reviews_${listingId.slice(0, 40)}`,
        },
      );
    },

    getVisibilityMechanics() {
      return config.mechanics;
    },
  };

  return adapter;
}

export function registerGrokMarketplaceAdapter(opts: GrokMarketplaceAdapterOptions): PlatformAdapter {
  const adapter = createGrokMarketplaceAdapter(opts);
  registerPlatformAdapter(adapter);
  return adapter;
}
