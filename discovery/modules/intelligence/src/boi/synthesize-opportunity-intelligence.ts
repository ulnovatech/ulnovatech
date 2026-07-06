import type { BusinessIntelligenceProfile } from '../bi/types';
import { buildBoIGapsAndPains, type BoIIntentSignalInput } from './build-structured-pains';
import { buildDepthEnrichment } from './build-depth-enrichment';
import { buildSalesBrief } from './build-sales-brief';
import { computePurchaseReadiness } from './compute-purchase-readiness';
import { mapPainsToSolutions } from './map-pains-to-solutions';
import type { BoIOpportunityIntelligence, BoIOpportunityStatus, BoIPageSpeedSnapshot } from './types';

function deriveBoiStatus(
  profile: BusinessIntelligenceProfile,
  pains: { length: number },
  gaps: { length: number },
): BoIOpportunityStatus {
  if (pains.length === 0 && gaps.length === 0) return 'partial';
  if (profile.completeness.score < 25 && pains.length + gaps.length < 2) return 'partial';
  return 'ready';
}

/**
 * Full rules-first BOI synthesis from a BI profile and optional intent signals.
 */
export function synthesizeOpportunityIntelligence(input: {
  profile: BusinessIntelligenceProfile;
  intentSignals?: BoIIntentSignalInput[];
  pageSpeed?: BoIPageSpeedSnapshot | null;
}): BoIOpportunityIntelligence {
  const { evidence, digitalGaps, pains } = buildBoIGapsAndPains(input);
  const solutions = mapPainsToSolutions({ pains, digitalGaps });
  const purchaseReadiness = computePurchaseReadiness(input.profile, digitalGaps, pains);
  const depth = buildDepthEnrichment({
    profile: input.profile,
    digitalGaps,
    pageSpeed: input.pageSpeed,
  });
  const salesBrief = buildSalesBrief({
    profile: input.profile,
    pains,
    digitalGaps,
    solutions,
    purchaseReadiness,
    evidence,
    depth,
  });

  return {
    schemaVersion: 1,
    status: deriveBoiStatus(input.profile, pains, digitalGaps),
    synthesizedAt: new Date().toISOString(),
    evidence,
    digitalGaps,
    pains,
    solutions,
    purchaseReadiness,
    salesBrief,
    sentimentSummary: depth.sentimentSummary,
    techStack: depth.techStack,
    projectValue: depth.projectValue,
    pageSpeed: depth.pageSpeed,
  };
}
