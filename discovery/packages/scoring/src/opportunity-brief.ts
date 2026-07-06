export type OpportunityType =
  | 'demand_response'
  | 'greenfield'
  | 'redesign'
  | 'modernize'
  | 'general';

export type OpportunityBriefInput = {
  factors: Record<string, number>;
  hasWebsite?: boolean;
  demandSignalCount?: number;
  bi?: import('./bi-scoring').BiScoringHints;
  footprintPlatforms?: string[];
};

export type FactorChip = {
  key: string;
  label: string;
  value: number;
};

export const POSITIVE_FACTOR_LABELS: Record<string, string> = {
  noWebsite: 'No website',
  hasWebsite: 'Has website',
  noHttps: 'No HTTPS',
  notMobileFriendly: 'Not mobile-friendly',
  socialOnlyPresence: 'Social-only presence',
  linktreeOnly: 'Link-in-bio only',
  noBooking: 'No online booking',
  missingEmailCapture: 'No email capture',
  missingAnalytics: 'No analytics',
  needsLeadGen: 'Needs lead gen',
  demandSignals: 'Demand signals',
  enrichmentSignals: 'Enrichment signals',
  hasEmail: 'Email on file',
  hasPhone: 'Phone on file',
  industryMatch: 'Industry match',
};

export const NEGATIVE_FACTOR_LABELS: Record<string, string> = {
  suppressed: 'Suppressed',
  alreadyContacted: 'Already contacted',
  noContactPath: 'No contact path',
};

export const OPPORTUNITY_TYPE_LABELS: Record<OpportunityType, string> = {
  demand_response: 'Demand response',
  greenfield: 'Greenfield site',
  redesign: 'Redesign',
  modernize: 'Modernize',
  general: 'General fit',
};

export function getPositiveFactors(factors: Record<string, number>): FactorChip[] {
  return Object.entries(factors)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({
      key,
      label: POSITIVE_FACTOR_LABELS[key] ?? key,
      value,
    }));
}

export function getBlockerFactors(factors: Record<string, number>): FactorChip[] {
  return Object.entries(factors)
    .filter(([, value]) => value < 0)
    .map(([key, value]) => ({
      key,
      label: NEGATIVE_FACTOR_LABELS[key] ?? key,
      value,
    }));
}

export function deriveOpportunityType(input: OpportunityBriefInput): OpportunityType {
  const { factors, hasWebsite, demandSignalCount = 0, bi } = input;
  const hasDemand = (factors.demandSignals ?? 0) > 0 || demandSignalCount > 0;
  const noWebsite =
    (factors.noWebsite ?? 0) > 0 ||
    hasWebsite === false ||
    bi?.socialOnlyPresence === true ||
    bi?.linktreeOnly === true;
  const notMobile = (factors.notMobileFriendly ?? 0) > 0;
  const noHttps = (factors.noHttps ?? 0) > 0;

  if (hasDemand) return 'demand_response';
  if (noWebsite) return 'greenfield';
  if (bi?.linktreeOnly && !bi.socialOnlyPresence) return 'greenfield';
  if (notMobile || noHttps) return notMobile && noHttps ? 'redesign' : notMobile ? 'redesign' : 'modernize';
  if ((factors.hasWebsite ?? 0) > 0 || hasWebsite === true) return 'modernize';
  return 'general';
}

export function derivePitchAngle(input: OpportunityBriefInput): string {
  const { factors, demandSignalCount = 0, bi } = input;
  const type = deriveOpportunityType(input);
  const hasDemand = (factors.demandSignals ?? 0) > 0 || demandSignalCount > 0;
  const noWebsite =
    (factors.noWebsite ?? 0) > 0 ||
    input.hasWebsite === false ||
    bi?.socialOnlyPresence === true;
  const phoneOnly = (factors.hasPhone ?? 0) > 0 && !(factors.hasEmail ?? 0);
  const notMobile = (factors.notMobileFriendly ?? 0) > 0;
  const noHttps = (factors.noHttps ?? 0) > 0;

  if (bi?.socialOnlyPresence) {
    return 'Social-only presence — pitch a professional website that converts traffic from their social profiles.';
  }
  if (bi?.linktreeOnly) {
    return 'Link-in-bio only — offer a real site that owns their brand, SEO, and booking flow beyond a bio page.';
  }
  if (bi?.missingOnlineBooking) {
    return 'No online booking detected — propose appointment scheduling integrated with their site.';
  }
  if (bi?.needsLeadGen) {
    return 'Lead-gen gap — missing email capture or analytics; pitch forms, tracking, and measurable follow-up.';
  }

  if (hasDemand && noWebsite) {
    return 'Hot demand with no website — high-intent greenfield; lead with a fast launch offer.';
  }
  if (hasDemand && (notMobile || noHttps)) {
    return 'Active demand plus site gaps — propose a focused redesign with clear before/after wins.';
  }
  if (hasDemand) {
    return 'Respond to active demand while intent is hot — reference their request in outreach.';
  }
  if (type === 'greenfield' && phoneOnly) {
    return 'No website but phone verified — call-first greenfield pitch for a first professional site.';
  }
  if (type === 'greenfield') {
    return 'Greenfield site — they have no web presence; pitch discovery call plus starter package.';
  }
  if (type === 'redesign') {
    return 'Redesign angle — mobile and trust gaps hurt conversions; offer audit plus fixed-scope refresh.';
  }
  if (type === 'modernize') {
    return 'Modernize angle — HTTPS and credibility upgrades as a low-friction first project.';
  }
  return 'Validate fit on first touch — confirm web needs before proposing scope.';
}

export function deriveOpportunityBrief(input: OpportunityBriefInput) {
  const opportunityType = deriveOpportunityType(input);
  return {
    opportunityType,
    opportunityTypeLabel: OPPORTUNITY_TYPE_LABELS[opportunityType],
    pitchAngle: derivePitchAngle(input),
    positiveFactors: getPositiveFactors(input.factors),
    blockers: getBlockerFactors(input.factors),
  };
}

export type WebsiteGapSeverity = 'high' | 'medium' | 'info';

export type WebsiteGap = {
  key: string;
  label: string;
  severity: WebsiteGapSeverity;
};

export type DemandSnippet = {
  id: string;
  title: string | null;
  snippet: string | null;
  signalStrength: number;
  source: string;
};

export type WebsiteAnalysisSnapshot = {
  hasWebsite: boolean;
  httpsEnabled: boolean | null;
  mobileFriendly: boolean | null;
  notes: string | null;
  analyzedAt?: string | null;
};

export type WebsiteOpportunityBriefContext = OpportunityBriefInput & {
  website?: string | null;
  analysis?: WebsiteAnalysisSnapshot | null;
  crawlStatus?: string | null;
  score?: number;
  reachability?: string;
  demandSnippets?: DemandSnippet[];
  footprintChips?: string[];
  infrastructureGaps?: WebsiteGap[];
};

const CRAWL_STATUS_LABELS: Record<string, string> = {
  blocked: 'Crawl blocked — site may restrict automated access',
  unreachable: 'Site unreachable during crawl',
  no_website: 'No website to crawl',
  budget_exhausted: 'Crawl skipped — page budget exhausted',
  skipped: 'Crawl skipped',
  ok: 'Crawl completed',
};

export function labelCrawlStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  return CRAWL_STATUS_LABELS[status] ?? `Crawl status: ${status}`;
}

export function deriveWebsiteGaps(ctx: WebsiteOpportunityBriefContext): WebsiteGap[] {
  const gaps: WebsiteGap[] = [];
  const hasWebsite = ctx.analysis?.hasWebsite ?? !!ctx.website;

  if (!hasWebsite) {
    gaps.push({ key: 'no_website', label: 'No website — greenfield opportunity', severity: 'high' });
  }
  if (hasWebsite && ctx.analysis?.httpsEnabled === false) {
    gaps.push({ key: 'no_https', label: 'No HTTPS — trust and SEO gap', severity: 'medium' });
  }
  if (hasWebsite && ctx.analysis?.mobileFriendly === false) {
    gaps.push({
      key: 'not_mobile',
      label: 'Not mobile-friendly — conversion risk',
      severity: 'medium',
    });
  }
  if (ctx.crawlStatus === 'blocked') {
    gaps.push({
      key: 'crawl_blocked',
      label: 'Crawl blocked — may need manual site review',
      severity: 'info',
    });
  } else if (ctx.crawlStatus === 'unreachable') {
    gaps.push({
      key: 'crawl_unreachable',
      label: 'Site unreachable — verify URL before outreach',
      severity: 'info',
    });
  }

  if (ctx.bi?.missingOnlineBooking) {
    gaps.push({
      key: 'no_booking',
      label: 'No online booking widget detected',
      severity: 'medium',
    });
  }
  if (ctx.bi?.missingEmailCapture) {
    gaps.push({
      key: 'no_email_capture',
      label: 'No email capture / newsletter form',
      severity: 'medium',
    });
  }
  if (ctx.bi?.missingAnalytics) {
    gaps.push({
      key: 'no_analytics',
      label: 'No analytics tracking detected',
      severity: 'info',
    });
  }
  if (ctx.bi?.socialOnlyPresence) {
    gaps.push({
      key: 'social_only',
      label: 'Social-only web presence',
      severity: 'high',
    });
  }
  if (ctx.bi?.linktreeOnly) {
    gaps.push({
      key: 'link_in_bio_only',
      label: 'Link-in-bio page instead of owned website',
      severity: 'high',
    });
  }

  return gaps;
}

export function buildWebsiteOpportunityBrief(ctx: WebsiteOpportunityBriefContext) {
  const core = deriveOpportunityBrief(ctx);
  const websiteGaps = deriveWebsiteGaps(ctx);
  const crawlLabel = labelCrawlStatus(ctx.crawlStatus);
  const demandSnippets = (ctx.demandSnippets ?? []).slice(0, 5);

  return {
    ...core,
    websiteGaps,
    footprintChips: ctx.footprintChips ?? [],
    infrastructureGaps: ctx.infrastructureGaps ?? websiteGaps.filter((g) =>
      ['no_booking', 'no_email_capture', 'no_analytics', 'social_only', 'link_in_bio_only'].includes(g.key),
    ),
    crawlStatus: ctx.crawlStatus ?? null,
    crawlStatusLabel: crawlLabel,
    website: ctx.website ?? null,
    analysis: ctx.analysis ?? null,
    score: ctx.score ?? null,
    reachability: ctx.reachability ?? null,
    demandSnippets,
    outreachHook: core.pitchAngle,
  };
}
