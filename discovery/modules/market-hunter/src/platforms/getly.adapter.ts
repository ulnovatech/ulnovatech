import { registerGrokMarketplaceAdapter } from './grok-adapter.factory';

export const getlyAdapter = registerGrokMarketplaceAdapter({
  platformKey: 'getly',
  allowedDomain: 'getly.store',
  resolveReviewUrl: (listingId, baseUrl) =>
    listingId.startsWith('http') ? listingId : `${baseUrl.replace(/\/$/, '')}/products/${listingId}`,
});
