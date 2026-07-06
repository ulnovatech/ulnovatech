import { registerGrokMarketplaceAdapter } from './grok-adapter.factory';

/** Review-signal platform — listings feed Type-1 stats, not action cards alone. */
export const g2Adapter = registerGrokMarketplaceAdapter({
  platformKey: 'g2',
  allowedDomain: 'g2.com',
  resolveReviewUrl: (listingId) =>
    listingId.startsWith('http') ? listingId : `https://www.g2.com/products/${listingId}/reviews`,
});
