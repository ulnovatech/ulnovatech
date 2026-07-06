import type { Reachability } from '@agency/scoring';

/** Tier 1 — hot demand always sorts above discovery opportunities. */
export const DEMAND_PRIORITY_BASE = 10_000;

/** Tier 2 — verified accounts from discovery. */
export const VERIFIED_OPPORTUNITY_BASE = 5_000;

/** Tier 3 — unverified discovery prospects. */
export const UNVERIFIED_OPPORTUNITY_BASE = 1_000;

const REACHABILITY_BONUS: Record<Reachability, number> = {
  high: 30,
  medium: 20,
  low: 10,
  none: 0,
};

export type WorkQueueTier = 'demand' | 'verified_opportunity' | 'unverified_opportunity';

export function computeDemandPriority(signalStrength: number): number {
  return DEMAND_PRIORITY_BASE + Math.max(0, Math.min(100, signalStrength));
}

export function computeOpportunityPriority(
  verified: boolean,
  reachability: Reachability,
  score: number,
): number {
  const base = verified ? VERIFIED_OPPORTUNITY_BASE : UNVERIFIED_OPPORTUNITY_BASE;
  const bonus = verified ? REACHABILITY_BONUS[reachability] ?? 0 : 0;
  return base + Math.max(0, Math.min(100, score)) + bonus;
}

export function opportunityTier(verified: boolean): 'verified_opportunity' | 'unverified_opportunity' {
  return verified ? 'verified_opportunity' : 'unverified_opportunity';
}

export const WORK_QUEUE_TIER_LABELS: Record<WorkQueueTier, string> = {
  demand: 'Hot demand',
  verified_opportunity: 'Verified opportunity',
  unverified_opportunity: 'Unverified opportunity',
};
