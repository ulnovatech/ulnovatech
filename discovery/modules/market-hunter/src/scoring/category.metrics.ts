import type { MarketplaceListing } from '../platforms/base.adapter';
import { detectGhost } from './ghost.filter';
import type { CategoryMetrics } from './types';

export type CategoryMetricsOptions = {
  asOf?: Date;
  /** Fraction of listings flagged ghost to mark category as ghost-town (default 0.5). */
  ghostTownRatioThreshold?: number;
  /** Avg sales below this after ghosts removed marks ghost-town (default 5). */
  ghostTownAvgSalesThreshold?: number;
};

export function computeCategoryMetrics(
  listings: MarketplaceListing[],
  options: CategoryMetricsOptions = {},
): CategoryMetrics {
  const ghostTownRatioThreshold = options.ghostTownRatioThreshold ?? 0.5;
  const ghostTownAvgSalesThreshold = options.ghostTownAvgSalesThreshold ?? 5;

  if (listings.length === 0) {
    return {
      listingCount: 0,
      avgSales: 0,
      ghostCount: 0,
      ghostTown: false,
    };
  }

  let ghostCount = 0;
  let salesSum = 0;

  for (const listing of listings) {
    const verdict = detectGhost(listing, { asOf: options.asOf });
    if (verdict.isGhost) {
      ghostCount += 1;
    } else {
      salesSum += listing.salesCount;
    }
  }

  const nonGhostCount = listings.length - ghostCount;
  const avgSales = nonGhostCount > 0 ? salesSum / nonGhostCount : 0;
  const ghostRatio = ghostCount / listings.length;

  const ghostTown =
    listings.length >= 5 &&
    (ghostRatio >= ghostTownRatioThreshold ||
      (nonGhostCount > 0 && avgSales < ghostTownAvgSalesThreshold));

  return {
    listingCount: listings.length,
    avgSales: Math.round(avgSales * 10) / 10,
    ghostCount,
    ghostTown,
  };
}
