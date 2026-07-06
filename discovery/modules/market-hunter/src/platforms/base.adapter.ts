import type { MarketHunterPlatformKey } from '../types';

export type PlatformSortOrder = 'best_selling' | 'newest' | 'relevance' | 'trending';

/** How this platform contributes to gap scoring. */
export type PlatformRole = 'marketplace' | 'review_signal' | 'demand_signal';

export type PlatformMechanics = {
  hasNewListingBoost: boolean;
  newListingBoostDurationDays: number;
  defaultSortOrder: PlatformSortOrder;
  trendingRequiresVelocity: boolean;
  velocityWindowDays?: number;
  keywordsAffectRanking: boolean;
  minimumSalesForVisibility: number;
};

/** Normalized marketplace listing — populated by adapters from live research. */
export type MarketplaceListing = {
  id: string;
  platform: MarketHunterPlatformKey;
  title: string;
  price: number;
  salesCount: number;
  lastUpdatedDate: Date;
  publishedDate: Date;
  tags: string[];
  reviewCount: number;
  averageRating: number;
  sellerName: string;
  category: string;
  url: string;
  rawReviewText?: string[];
};

export type FetchListingsParams = {
  category: string;
  limit: number;
};

/**
 * Every marketplace platform implements this interface.
 * Adding a platform = one adapter file + config block in platform-config.ts.
 */
export interface PlatformAdapter {
  readonly platformKey: MarketHunterPlatformKey;
  readonly platformName: string;
  readonly role: PlatformRole;

  fetchListings(params: FetchListingsParams): Promise<MarketplaceListing[]>;
  getReviews(listingId: string): Promise<string[]>;
  getVisibilityMechanics(): PlatformMechanics;
}

export function listingKey(listing: Pick<MarketplaceListing, 'platform' | 'id' | 'url'>): string {
  return `${listing.platform}:${listing.id || listing.url}`;
}
