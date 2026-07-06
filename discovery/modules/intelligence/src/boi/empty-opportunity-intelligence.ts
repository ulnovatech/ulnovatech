import type { BoIOpportunityIntelligence } from './types';

/** Empty BOI shell — populated by synthesis in later chunks. */
export function emptyOpportunityIntelligence(): BoIOpportunityIntelligence {
  return {
    schemaVersion: 1,
    status: 'pending',
    synthesizedAt: null,
    evidence: [],
    digitalGaps: [],
    pains: [],
    solutions: [],
    purchaseReadiness: null,
    salesBrief: null,
    sentimentSummary: null,
    techStack: null,
    projectValue: null,
    pageSpeed: null,
  };
}
