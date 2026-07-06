import { getAdapterScanContext } from './adapter-context';
import { getPlatformConfig } from './platform-config';
import { registerPlatformAdapter } from './registry';
import type { PlatformAdapter } from './base.adapter';
import type { FetchListingsParams } from './base.adapter';
import { researchListingReviews, researchPlatformListings } from '../research/grok.client';

/**
 * Reddit demand-signal adapter — Type 1 flags only (orchestrator never emits action cards from this alone).
 */
export const redditAdapter: PlatformAdapter = {
  platformKey: 'reddit',
  platformName: 'Reddit',
  role: 'demand_signal',

  async fetchListings(params: FetchListingsParams) {
    const config = getPlatformConfig('reddit');
    const ctx = getAdapterScanContext();
    return researchPlatformListings(
      'reddit',
      {
        platform: `Reddit r/${params.category}`,
        platformBaseUrl: config.baseUrl,
        category: params.category,
        limit: params.limit,
        allowedDomain: 'reddit.com',
      },
      {
        scanId: ctx.scanId,
        spendGuard: ctx.spendGuard,
        operation: `reddit_signals_${params.category}`,
      },
    );
  },

  async getReviews(listingId: string) {
    const ctx = getAdapterScanContext();
    const url = listingId.startsWith('http') ? listingId : `https://www.reddit.com/${listingId}`;
    return researchListingReviews(
      {
        platform: 'Reddit',
        listingUrl: url,
        limit: 15,
      },
      {
        scanId: ctx.scanId,
        spendGuard: ctx.spendGuard,
        operation: `reddit_comments_${listingId.slice(0, 32)}`,
      },
    );
  },

  getVisibilityMechanics() {
    return getPlatformConfig('reddit').mechanics;
  },
};

registerPlatformAdapter(redditAdapter);
