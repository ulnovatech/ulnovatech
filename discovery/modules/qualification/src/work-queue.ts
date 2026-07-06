import type { OpportunityType, Reachability } from '@agency/scoring';
import type { ReviewQueueFilters } from './review-queue-query';
import {
  computeDemandPriority,
  computeOpportunityPriority,
  opportunityTier,
  type WorkQueueTier,
} from './work-queue-priority';

export type WorkQueueKindFilter = 'all' | 'demand' | 'opportunity';

export type WorkQueueFilters = ReviewQueueFilters & {
  kind?: WorkQueueKindFilter;
  opportunityType?: OpportunityType;
};

export type DemandWorkItem = {
  id: string;
  source: string;
  signalType: string;
  signalStrength: number;
  title: string | null;
  snippet: string | null;
  sourceUrl: string | null;
  capturedAt: string;
};

export type OpportunityWorkItem = {
  business: {
    id: string;
    name: string;
    city: string | null;
    website: string | null;
    email?: string | null;
    phone?: string | null;
  };
  account: { id: string };
  run: { id: string; industry: string; city: string };
  score: number;
  reachability: Reachability;
  factors: Record<string, number>;
  verified: boolean;
  listSuppressed?: boolean;
  demandSignalCount: number;
  enrichmentSignalCount: number;
  opportunityType: OpportunityType;
  opportunityTypeLabel: string;
  pitchAngle: string;
  positiveFactors: Array<{ key: string; label: string; value: number }>;
  blockers: Array<{ key: string; label: string; value: number }>;
  footprintChips?: string[];
};

export type WorkQueueDemandEntry = {
  kind: 'demand';
  priority: number;
  tier: 'demand';
  tierLabel: string;
  demand: DemandWorkItem;
};

export type WorkQueueOpportunityEntry = {
  kind: 'opportunity';
  priority: number;
  tier: 'verified_opportunity' | 'unverified_opportunity';
  tierLabel: string;
  opportunity: OpportunityWorkItem;
};

export type WorkQueueEntry = WorkQueueDemandEntry | WorkQueueOpportunityEntry;

export type WorkQueueCounts = {
  demand: number;
  opportunity: number;
  verifiedOpportunity: number;
  unverifiedOpportunity: number;
};

export const WORK_QUEUE_OPP_BATCH = 300;

export function buildDemandEntry(signal: {
  id: string;
  source: string;
  signalType: string;
  signalStrength: number;
  title: string | null;
  snippet: string | null;
  sourceUrl: string | null;
  capturedAt: Date;
}): WorkQueueDemandEntry {
  return {
    kind: 'demand',
    priority: computeDemandPriority(signal.signalStrength),
    tier: 'demand',
    tierLabel: 'Hot demand',
    demand: {
      id: signal.id,
      source: signal.source,
      signalType: signal.signalType,
      signalStrength: signal.signalStrength,
      title: signal.title,
      snippet: signal.snippet,
      sourceUrl: signal.sourceUrl,
      capturedAt: signal.capturedAt.toISOString(),
    },
  };
}

export function buildOpportunityEntry(opportunity: OpportunityWorkItem): WorkQueueOpportunityEntry {
  const tier = opportunityTier(opportunity.verified);
  return {
    kind: 'opportunity',
    priority: computeOpportunityPriority(
      opportunity.verified,
      opportunity.reachability,
      opportunity.score,
    ),
    tier,
    tierLabel: tier === 'verified_opportunity' ? 'Verified opportunity' : 'Unverified opportunity',
    opportunity,
  };
}

export function mergeWorkQueueEntries(
  demand: WorkQueueDemandEntry[],
  opportunities: WorkQueueOpportunityEntry[],
): WorkQueueEntry[] {
  return [...demand, ...opportunities].sort((a, b) => b.priority - a.priority);
}

export function paginateWorkQueue<T>(items: T[], page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const offset = (safePage - 1) * safeLimit;
  return {
    items: items.slice(offset, offset + safeLimit),
    total: items.length,
    page: safePage,
    limit: safeLimit,
  };
}

export function workQueueCounts(
  demand: WorkQueueDemandEntry[],
  opportunities: WorkQueueOpportunityEntry[],
): WorkQueueCounts {
  return {
    demand: demand.length,
    opportunity: opportunities.length,
    verifiedOpportunity: opportunities.filter((o) => o.tier === 'verified_opportunity').length,
    unverifiedOpportunity: opportunities.filter((o) => o.tier === 'unverified_opportunity').length,
  };
}

export type { WorkQueueTier };
