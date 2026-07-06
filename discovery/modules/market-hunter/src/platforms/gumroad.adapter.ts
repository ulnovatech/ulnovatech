import { registerGrokMarketplaceAdapter } from './grok-adapter.factory';

export const gumroadAdapter = registerGrokMarketplaceAdapter({
  platformKey: 'gumroad',
  allowedDomain: 'gumroad.com',
  resolveReviewUrl: (listingId) =>
    listingId.startsWith('http') ? listingId : `https://gumroad.com/l/${listingId}`,
});
