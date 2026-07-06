import { registerGrokMarketplaceAdapter } from './grok-adapter.factory';

export const producthuntAdapter = registerGrokMarketplaceAdapter({
  platformKey: 'producthunt',
  allowedDomain: 'producthunt.com',
  resolveReviewUrl: (listingId) =>
    listingId.startsWith('http') ? listingId : `https://www.producthunt.com/posts/${listingId}`,
});
