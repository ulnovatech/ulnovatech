import { applyBiScoringFactors, deriveBiScoringHints, type BiScoringInput } from './bi-scoring';

export type Reachability = 'high' | 'medium' | 'low' | 'none';

export type MinReachabilityLevel = 'low' | 'medium' | 'high';

const REACHABILITY_RANK: Record<Reachability, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function reachabilityLevelsAtOrAbove(min: MinReachabilityLevel): Reachability[] {
  const minRank = REACHABILITY_RANK[min];
  return (Object.keys(REACHABILITY_RANK) as Reachability[]).filter(
    (level) => REACHABILITY_RANK[level] >= minRank,
  );
}

export function meetsMinReachability(
  actual: Reachability | null | undefined,
  min: MinReachabilityLevel,
): boolean {
  const rank = REACHABILITY_RANK[actual ?? 'none'];
  return rank >= REACHABILITY_RANK[min];
}

export interface ScoringInput {
  hasWebsite: boolean;
  httpsEnabled: boolean | null;
  mobileFriendly: boolean | null;
  /** @deprecated Use enrichmentSignalStrength + demandSignalStrength */
  intentSignalStrength?: number;
  enrichmentSignalStrength?: number;
  demandSignalStrength?: number;
  hasEmail: boolean;
  hasPhone: boolean;
  /** When false, email present but invalid format */
  emailValid?: boolean;
  industryMatch: boolean;
  suppressed?: boolean;
  alreadyContacted?: boolean;
  /** When true (default), no-website businesses get opportunity bonus — web-agency ICP. */
  requireWebsiteOpportunity?: boolean;
  /** Scales demand signal contribution (default 1.0). */
  demandWeightMultiplier?: number;
  /** BI profile hints from bi_enrich stage */
  bi?: BiScoringInput;
}

export interface ScoringResult {
  score: number;
  factors: Record<string, number>;
  reachability: Reachability;
}

export function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function computeReachability(
  input: Pick<
    ScoringInput,
    'hasEmail' | 'hasPhone' | 'emailValid' | 'demandSignalStrength' | 'suppressed' | 'alreadyContacted'
  >,
): Reachability {
  if (input.suppressed || input.alreadyContacted) return 'none';

  const validEmail = input.hasEmail && input.emailValid !== false;
  const hasPhone = input.hasPhone;
  const strongDemand = (input.demandSignalStrength ?? 0) >= 50;

  if (!validEmail && !hasPhone) return 'none';
  if (validEmail && (hasPhone || strongDemand)) return 'high';
  if (validEmail) return 'medium';
  if (hasPhone) return 'low';
  return 'none';
}

export function computeLeadScore(input: ScoringInput): ScoringResult {
  const factors: Record<string, number> = {};

  const enrichment = input.enrichmentSignalStrength ?? 0;
  const demand = input.demandSignalStrength ?? 0;
  const validEmail = input.hasEmail && (input.emailValid ?? true);

  if (input.suppressed) factors.suppressed = -1000;
  if (input.alreadyContacted) factors.alreadyContacted = -1000;
  if (!validEmail && !input.hasPhone) factors.noContactPath = -1000;

  const requireWebsiteOpportunity = input.requireWebsiteOpportunity ?? true;
  const demandMultiplier = input.demandWeightMultiplier ?? 1;

  if (!input.hasWebsite && requireWebsiteOpportunity) {
    factors.noWebsite = 20;
  } else if (input.hasWebsite) {
    factors.hasWebsite = 5;
  }

  if (input.hasWebsite && input.httpsEnabled === false) {
    factors.noHttps = 5;
  }

  if (input.hasWebsite && input.mobileFriendly === false) {
    factors.notMobileFriendly = 5;
  }

  if (demand > 0) {
    factors.demandSignals = Math.min(25, Math.round(demand * 0.25 * demandMultiplier));
  }

  if (enrichment > 0) {
    factors.enrichmentSignals = Math.min(10, Math.round(enrichment * 0.1));
  }

  if (validEmail) factors.hasEmail = 30;
  if (input.hasPhone) factors.hasPhone = 15;
  if (input.industryMatch) factors.industryMatch = 10;

  if (input.bi) {
    const hints = deriveBiScoringHints(input.bi);
    Object.assign(factors, applyBiScoringFactors(factors, hints));
  }

  const raw = Object.values(factors).reduce((a, b) => a + b, 0);
  const score = Math.max(0, Math.min(100, raw));
  const reachability = computeReachability({
    hasEmail: input.hasEmail,
    hasPhone: input.hasPhone,
    emailValid: input.emailValid,
    demandSignalStrength: demand,
    suppressed: input.suppressed,
    alreadyContacted: input.alreadyContacted,
  });

  return { score, factors, reachability };
}

export {
  applyBiScoringFactors,
  biScoringInputFromProfile,
  BI_OPPORTUNITY_FLAG_LABELS,
  deriveBiScoringHints,
  footprintChipLabels,
  hasRealWebsite,
  isLinkInBioWebsite,
} from './bi-scoring';
export type { BiScoringHints, BiScoringInput } from './bi-scoring';

export {
  buildWebsiteOpportunityBrief,
  deriveOpportunityBrief,
  deriveOpportunityType,
  derivePitchAngle,
  deriveWebsiteGaps,
  getBlockerFactors,
  getPositiveFactors,
  labelCrawlStatus,
  NEGATIVE_FACTOR_LABELS,
  OPPORTUNITY_TYPE_LABELS,
  POSITIVE_FACTOR_LABELS,
} from './opportunity-brief';
export type {
  DemandSnippet,
  FactorChip,
  OpportunityBriefInput,
  OpportunityType,
  WebsiteAnalysisSnapshot,
  WebsiteGap,
  WebsiteOpportunityBriefContext,
} from './opportunity-brief';
