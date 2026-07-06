import { setAdapterScanContext, type AdapterScanContext } from './adapter-context';
import { registerGrokMarketplaceAdapter } from './grok-adapter.factory';

export type CodeCanyonAdapterContext = AdapterScanContext;

/** @deprecated Use setAdapterScanContext */
export function setCodeCanyonAdapterContext(ctx: CodeCanyonAdapterContext): void {
  setAdapterScanContext(ctx);
}

export const codecanyonAdapter = registerGrokMarketplaceAdapter({
  platformKey: 'codecanyon',
  allowedDomain: 'codecanyon.net',
  resolveReviewUrl: (listingId) =>
    listingId.startsWith('http')
      ? listingId
      : `https://codecanyon.net/item/${listingId}`,
});
