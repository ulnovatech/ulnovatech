import { JobRepository } from '@agency/acquisition';
import { getDb, businesses, leadScores, websiteAnalyses, accounts } from '@agency/database';
import { platformSettings } from '@agency/settings';
import { eq } from 'drizzle-orm';
import {
  businessRowToProspectShape,
  countHighPotentialEstimate,
  countProspectCandidates,
} from './lib/prospect-metrics';
import { prospectVerifyBoost } from './providers/places/needs-verify';
import { DiscoveryRepository } from './repository';
import type { DiscoveredBusiness } from './providers/types';

export type DiscoveryRunStats = {
  updatedAt: string;
  prospectFocus: boolean;
  candidatesDiscovered: number;
  prospectCandidates: number;
  highPotentialEstimate: number;
  prospectSaved: number;
  discoverBySource: Record<string, number>;
  accountsSaved: number;
  savedBySource: Record<string, number>;
  suppressedSkipped: number;
  withEmail: number;
  withPhone: number;
  contactable: number;
  withWebsite: number;
  crawled: number;
  scored: number;
  scoredAtOrAboveMin: number;
  reachabilityMediumOrHigh: number;
  contactablePct: number | null;
  websitePct: number | null;
  scoredPct: number | null;
};

const DEFAULT_MIN_SCORE = 25;

function pct(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function countBySource(items: Array<{ source: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.source] = (counts[item.source] ?? 0) + 1;
  }
  return counts;
}

function readDiscoverCandidates(payload: unknown): DiscoveredBusiness[] {
  if (!payload || typeof payload !== 'object') return [];
  const candidates = (payload as { candidates?: DiscoveredBusiness[] }).candidates;
  return Array.isArray(candidates) ? candidates : [];
}

export async function computeRunYieldStats(runId: string): Promise<DiscoveryRunStats> {
  await platformSettings.ensureLoaded();
  const minScore =
    platformSettings.getPlacesRunSettings().detailsMinScore ?? DEFAULT_MIN_SCORE;

  const repo = new DiscoveryRepository();
  const run = await repo.getRun(runId);

  const db = getDb();
  const jobRepo = new JobRepository();
  const jobs = await jobRepo.findByRunId(runId);

  const discoverJob = jobs.find((j) => j.stage === 'discover' && j.status === 'completed');
  const candidates = readDiscoverCandidates(discoverJob?.payload);
  const resolvePayload = jobs.find((j) => j.stage === 'resolve_accounts' && j.status === 'completed')
    ?.payload as { suppressedSkipped?: number } | null;

  const rows = await db
    .select({
      business: businesses,
      score: leadScores.score,
      reachability: leadScores.reachability,
      hasWebsite: websiteAnalyses.hasWebsite,
      crawlStatus: accounts.crawlStatus,
    })
    .from(businesses)
    .leftJoin(leadScores, eq(leadScores.businessId, businesses.id))
    .leftJoin(websiteAnalyses, eq(websiteAnalyses.businessId, businesses.id))
    .leftJoin(accounts, eq(accounts.id, businesses.accountId))
    .where(eq(businesses.discoveryRunId, runId));

  let withEmail = 0;
  let withPhone = 0;
  let withWebsite = 0;
  let crawled = 0;
  let scored = 0;
  let scoredAtOrAboveMin = 0;
  let reachabilityMediumOrHigh = 0;

  const savedBySource = countBySource(rows.map((r) => r.business));

  for (const row of rows) {
    const b = row.business;
    if (b.email?.trim()) withEmail++;
    if (b.phone?.trim()) withPhone++;
    if (b.website?.trim()) withWebsite++;
    if (row.crawlStatus && row.crawlStatus !== 'skipped') crawled++;
    if (row.score != null) {
      scored++;
      if (row.score >= minScore) scoredAtOrAboveMin++;
    }
    if (row.reachability === 'medium' || row.reachability === 'high') {
      reachabilityMediumOrHigh++;
    }
  }

  const accountsSaved = rows.length;
  const contactable = rows.filter((r) => r.business.email?.trim() || r.business.phone?.trim()).length;
  const prospectSaved = rows.filter(
    (r) => prospectVerifyBoost(businessRowToProspectShape(r.business)) > 0,
  ).length;

  return {
    updatedAt: new Date().toISOString(),
    prospectFocus: run?.prospectFocus ?? false,
    candidatesDiscovered: candidates.length,
    prospectCandidates: countProspectCandidates(candidates),
    highPotentialEstimate: countHighPotentialEstimate(candidates),
    prospectSaved,
    discoverBySource: countBySource(candidates),
    accountsSaved,
    savedBySource,
    suppressedSkipped: resolvePayload?.suppressedSkipped ?? 0,
    withEmail,
    withPhone,
    contactable,
    withWebsite,
    crawled,
    scored,
    scoredAtOrAboveMin,
    reachabilityMediumOrHigh,
    contactablePct: pct(contactable, accountsSaved),
    websitePct: pct(withWebsite, accountsSaved),
    scoredPct: pct(scored, accountsSaved),
  };
}

export async function refreshRunYieldStats(runId: string): Promise<DiscoveryRunStats> {
  const stats = await computeRunYieldStats(runId);
  const repo = new DiscoveryRepository();
  await repo.updateRunStats(runId, stats as unknown as Record<string, unknown>);
  return stats;
}
