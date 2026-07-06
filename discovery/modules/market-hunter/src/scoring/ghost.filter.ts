import type { MarketplaceListing } from '../platforms/base.adapter';
import { monthsBetween } from './date.utils';
import type { GhostVerdict } from './types';

export type GhostFilterOptions = {
  asOf?: Date;
};

export function detectGhost(
  listing: MarketplaceListing,
  options: GhostFilterOptions = {},
): GhostVerdict {
  const asOf = options.asOf ?? new Date();
  const reasons: string[] = [];
  const monthsSincePublished = monthsBetween(listing.publishedDate, asOf);
  const monthsSinceUpdated = monthsBetween(listing.lastUpdatedDate, asOf);

  if (monthsSincePublished > 6 && listing.salesCount < 3) {
    reasons.push('Published 6+ months ago with under 3 sales — buried not unwanted');
  }

  if (listing.salesCount > 5 && listing.reviewCount === 0) {
    reasons.push(
      'Sales with zero reviews — weak product-market signal, possibly refunded or abandoned',
    );
  }

  if (monthsSinceUpdated > 24 && listing.salesCount < 10) {
    reasons.push('No update in 2+ years and low sales — functionally abandoned');
  }

  return {
    isGhost: reasons.length > 0,
    reasons,
  };
}

export function filterGhosts<T extends MarketplaceListing>(
  listings: T[],
  options: GhostFilterOptions = {},
): { passed: T[]; ghosts: Array<{ listing: T; verdict: GhostVerdict }> } {
  const passed: T[] = [];
  const ghosts: Array<{ listing: T; verdict: GhostVerdict }> = [];

  for (const listing of listings) {
    const verdict = detectGhost(listing, options);
    if (verdict.isGhost) {
      ghosts.push({ listing, verdict });
    } else {
      passed.push(listing);
    }
  }

  return { passed, ghosts };
}
