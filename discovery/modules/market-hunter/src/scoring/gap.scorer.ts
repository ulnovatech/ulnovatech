import type { MarketplaceListing } from '../platforms/base.adapter';
import type { PlatformMechanics } from '../platforms/base.adapter';
import { monthsBetween } from './date.utils';
import type { ComplaintAnalysis, GapScore } from './types';

export type GapScoreOptions = {
  asOf?: Date;
};

export function scoreListing(
  listing: MarketplaceListing,
  complaints: ComplaintAnalysis,
  _mechanics: PlatformMechanics,
  options: GapScoreOptions = {},
): GapScore {
  const asOf = options.asOf ?? new Date();
  const staleness = monthsBetween(listing.lastUpdatedDate, asOf);
  const hasComplaints = complaints.topComplaints.length >= 2;
  const hasProvenSales = listing.salesCount > 30;
  const hasBuildableComplaints = complaints.buildableFixes.length > 0;
  const isStale = staleness > 12;

  if (hasProvenSales && hasComplaints && hasBuildableComplaints) {
    const score = Math.min(
      100,
      listing.salesCount * 0.4 +
        staleness * 2 * 0.3 +
        complaints.topComplaints.length * 5 * 0.2 +
        complaints.confidenceScore * 0.1,
    );

    return {
      type: 'TYPE_2',
      score,
      staleness,
      salesProof: listing.salesCount,
      complaintDensity: complaints.topComplaints.length,
      recentVelocity: listing.salesCount > 0,
      verdict: `${listing.salesCount} proven buyers. ${complaints.buildableFixes.length} buildable fixes identified.`,
    };
  }

  if (hasProvenSales && isStale && !hasComplaints) {
    const score = Math.min(70, listing.salesCount * 0.5 + staleness * 1.5 * 0.5);

    return {
      type: 'TYPE_3',
      score,
      staleness,
      salesProof: listing.salesCount,
      complaintDensity: 0,
      recentVelocity: true,
      verdict: `${listing.salesCount} proven buyers. Product stale by ${staleness} months. Fresher version viable.`,
    };
  }

  return {
    type: 'NONE',
    score: 0,
    staleness,
    salesProof: listing.salesCount,
    complaintDensity: 0,
    recentVelocity: false,
    verdict: 'No actionable gap detected.',
  };
}
