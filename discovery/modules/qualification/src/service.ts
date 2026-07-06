import { AccountService } from '@agency/accounts';
import { getDb, leads } from '@agency/database';
import { DiscoveryRepository } from '@agency/discovery';
import { IntentService } from '@agency/intent';
import { IntelligenceService } from '@agency/intelligence';
import {
  buildWebsiteOpportunityBrief,
  biScoringInputFromProfile,
  computeLeadScore,
  deriveBiScoringHints,
  deriveOpportunityBrief,
  footprintChipLabels,
  hasRealWebsite,
  isValidEmailFormat,
  type BiScoringInput,
  type Reachability,
} from '@agency/scoring';
import type { BusinessIntelligenceProfile } from '@agency/intelligence';
import { platformSettings } from '@agency/settings';
import { mapWithConcurrency, pipelineConcurrency } from '@agency/config';
import { eq } from 'drizzle-orm';
import { QualificationRepository } from './repository';
import { queryReviewQueue, type ReviewQueueFilters } from './review-queue-query';
import {
  buildDemandEntry,
  buildOpportunityEntry,
  mergeWorkQueueEntries,
  paginateWorkQueue,
  WORK_QUEUE_OPP_BATCH,
  workQueueCounts,
  type OpportunityWorkItem,
  type WorkQueueFilters,
} from './work-queue';

export type { ReviewQueueFilters, WorkQueueFilters };
export type { VerificationFilter } from './review-verification';
export { canPromoteFromReview, isProspectVerified } from './review-verification';

type BiScoringContext = {
  biInput: BiScoringInput;
  biHints: ReturnType<typeof deriveBiScoringHints>;
  footprintChips: string[];
} | null;

export class QualificationService {
  private repo = new QualificationRepository();
  private discoveryRepo = new DiscoveryRepository();
  private intentService = new IntentService();
  private intelligenceService = new IntelligenceService();
  private accountService = new AccountService();

  private async loadBiScoringContext(businessId: string): Promise<BiScoringContext> {
    const row = await this.intelligenceService.getBiProfileByBusinessId(businessId);
    const profile = (row?.profile ?? null) as BusinessIntelligenceProfile | null;
    if (!profile) return null;

    const biInput = biScoringInputFromProfile(profile);
    return {
      biInput,
      biHints: deriveBiScoringHints(biInput),
      footprintChips: footprintChipLabels(biInput.socialPlatforms ?? []),
    };
  }

  async scoreBusiness(businessId: string, targetIndustry?: string) {
    const business = await this.discoveryRepo.getBusiness(businessId);
    if (!business) throw new Error('Business not found');

    const account = business.accountId
      ? await this.accountService.getById(business.accountId)
      : null;

    const analysis = await this.intelligenceService.getAnalysis(businessId);
    const signalStrength = await this.intentService.getStrengthByClass(businessId);
    const biContext = await this.loadBiScoringContext(businessId);

    const email = business.email || account?.email || '';
    const phone = business.phone || account?.phone || '';
    const hasEmail = !!email;
    const hasPhone = !!phone;

    let alreadyContacted = false;
    let suppressed = account?.suppressed ?? false;
    if (account) {
      alreadyContacted = !!(await getDb()
        .select({ id: leads.id })
        .from(leads)
        .where(eq(leads.accountId, account.id))
        .limit(1))[0];
      suppressed = suppressed || (await this.accountService.isSuppressed(account));
    }

    const hasWebsite = biContext
      ? hasRealWebsite(biContext.biInput)
      : (analysis?.hasWebsite ?? !!business.website);

    const settings = await platformSettings.ensureLoaded();
    const icp = settings.qualification.icp;

    const result = computeLeadScore({
      hasWebsite,
      httpsEnabled: analysis?.httpsEnabled ?? null,
      mobileFriendly: analysis?.mobileFriendly ?? null,
      enrichmentSignalStrength: signalStrength.enrichment,
      demandSignalStrength: signalStrength.demand,
      hasEmail,
      hasPhone,
      emailValid: hasEmail ? isValidEmailFormat(email) : undefined,
      industryMatch: targetIndustry
        ? (business.industry?.toLowerCase().includes(targetIndustry.toLowerCase()) ?? false)
        : true,
      suppressed,
      alreadyContacted,
      requireWebsiteOpportunity: icp.requireWebsiteOpportunity,
      demandWeightMultiplier: icp.demandWeightMultiplier,
      bi: biContext?.biInput,
    });

    return this.repo.upsertScore({
      businessId,
      score: result.score,
      reachability: result.reachability,
      factors: result.factors,
    });
  }

  async scoreRun(runId: string) {
    const run = await this.discoveryRepo.getRun(runId);
    const bizList = await this.discoveryRepo.listBusinessesByRun(runId);
    const concurrency = pipelineConcurrency();
    const scores = await mapWithConcurrency(bizList, concurrency, (b) =>
      this.scoreBusiness(b.id, run?.industry),
    );
    return { scored: scores.length };
  }

  /**
   * Re-score specific businesses after late pipeline enrichment (places details, review pain, browser contacts).
   */
  async rescoreBusinesses(
    runId: string,
    businessIds: string[],
  ): Promise<{ rescored: number; scoreIncreased: number }> {
    const unique = [...new Set(businessIds.filter(Boolean))];
    if (unique.length === 0) return { rescored: 0, scoreIncreased: 0 };

    const run = await this.discoveryRepo.getRun(runId);
    let scoreIncreased = 0;

    const concurrency = pipelineConcurrency();
    await mapWithConcurrency(unique, concurrency, async (businessId) => {
      const before = await this.repo.getScore(businessId);
      const after = await this.scoreBusiness(businessId, run?.industry);
      if ((after.score ?? 0) > (before?.score ?? 0)) scoreIncreased++;
      return after;
    });

    return { rescored: unique.length, scoreIncreased };
  }

  async getReviewQueue(
    filters: ReviewQueueFilters = {},
    options?: { applyPlatformDefaults?: boolean },
  ) {
    const settings = await platformSettings.ensureLoaded();
    const qual = settings.qualification;
    const applyDefaults = options?.applyPlatformDefaults !== false;

    const resolved: ReviewQueueFilters = {
      ...filters,
      minScore:
        filters.minScore ??
        (applyDefaults && qual.minScoreDefault > 0 ? qual.minScoreDefault : undefined),
      verification:
        filters.verification ??
        (applyDefaults && qual.requireContactForReview ? 'verified' : 'all'),
      minReachability:
        filters.reachability || filters.minReachability
          ? filters.minReachability
          : applyDefaults
            ? qual.icp.minReachabilityForExport
            : undefined,
    };

    const { rows, total, page, limit } = await queryReviewQueue(resolved);

    const items = await Promise.all(
      rows.map(async (row) => {
        const counts = await this.intentService.getSignalCounts(row.businessId);
        const email = row.businessEmail || row.accountEmail;
        const phone = row.businessPhone || row.accountPhone;
        const factors = row.factors ?? {};
        const biContext = await this.loadBiScoringContext(row.businessId);
        const hasWebsite = biContext
          ? hasRealWebsite(biContext.biInput)
          : !!row.businessWebsite;
        const opportunity = deriveOpportunityBrief({
          factors,
          hasWebsite,
          demandSignalCount: counts.demand,
          bi: biContext?.biHints,
          footprintPlatforms: biContext?.biInput.socialPlatforms,
        });

        return {
          business: {
            id: row.businessId,
            name: row.businessName,
            city: row.businessCity,
            website: row.businessWebsite,
            email,
            phone,
          },
          account: { id: row.accountId },
          run: { id: row.runId, industry: row.runIndustry, city: row.runCity },
          score: row.score,
          reachability: (row.reachability as Reachability) ?? 'none',
          factors,
          verified: row.verified,
          listSuppressed: row.listSuppressed,
          demandSignalCount: counts.demand,
          enrichmentSignalCount: counts.enrichment,
          opportunityType: opportunity.opportunityType,
          opportunityTypeLabel: opportunity.opportunityTypeLabel,
          pitchAngle: opportunity.pitchAngle,
          positiveFactors: opportunity.positiveFactors,
          blockers: opportunity.blockers,
          footprintChips: biContext?.footprintChips ?? [],
        };
      }),
    );

    return { queue: items, total, page, limit };
  }

  async getOpportunityBrief(businessId: string) {
    const business = await this.discoveryRepo.getBusiness(businessId);
    if (!business) throw new Error('Business not found');

    const account = business.accountId
      ? await this.accountService.getById(business.accountId)
      : null;
    const analysis = await this.intelligenceService.getAnalysis(businessId);
    const scoreRow = await this.repo.getScore(businessId);
    const signals = await this.intentService.listByBusiness(businessId);
    const signalCounts = await this.intentService.getSignalCounts(businessId);
    const biContext = await this.loadBiScoringContext(businessId);

    const factors =
      (scoreRow?.factors as Record<string, number> | undefined) ??
      (
        await this.scoreBusiness(
          businessId,
          business.industry ?? undefined,
        )
      ).factors;

    const hasWebsite = biContext
      ? hasRealWebsite(biContext.biInput)
      : (analysis?.hasWebsite ?? !!business.website);

    const demandSnippets = signals
      .filter((s) => s.signalClass === 'demand')
      .sort((a, b) => b.signalStrength - a.signalStrength)
      .map((s) => ({
        id: s.id,
        title: s.title,
        snippet: s.snippet,
        signalStrength: s.signalStrength,
        source: s.source,
      }));

    return buildWebsiteOpportunityBrief({
      factors,
      hasWebsite,
      demandSignalCount: signalCounts.demand,
      bi: biContext?.biHints,
      footprintPlatforms: biContext?.biInput.socialPlatforms,
      website: business.website,
      crawlStatus: account?.crawlStatus ?? null,
      score: scoreRow?.score ?? undefined,
      reachability: scoreRow?.reachability ?? undefined,
      footprintChips: biContext?.footprintChips,
      analysis: analysis
        ? {
            hasWebsite: analysis.hasWebsite,
            httpsEnabled: analysis.httpsEnabled,
            mobileFriendly: analysis.mobileFriendly,
            notes: analysis.notes,
            analyzedAt: analysis.analyzedAt?.toISOString() ?? null,
          }
        : null,
      demandSnippets,
    });
  }

  async getWorkQueue(filters: WorkQueueFilters = {}) {
    const kind = filters.kind ?? 'all';
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const demandEntries =
      kind === 'opportunity'
        ? []
        : (await this.intentService.listOrphanDemand({ page: 1, limit: 100 })).items.map(
            buildDemandEntry,
          );

    let opportunityEntries: ReturnType<typeof buildOpportunityEntry>[] = [];
    if (kind !== 'demand') {
      const { queue } = await this.getReviewQueue(
        {
          runId: filters.runId,
          minScore: filters.minScore,
          reachability: filters.reachability,
          minReachability: filters.minReachability,
          verification: filters.verification ?? 'all',
          page: 1,
          limit: WORK_QUEUE_OPP_BATCH,
        },
        { applyPlatformDefaults: false },
      );

      let opportunities = queue as OpportunityWorkItem[];
      if (filters.opportunityType) {
        opportunities = opportunities.filter((o) => o.opportunityType === filters.opportunityType);
      }
      opportunityEntries = opportunities.map(buildOpportunityEntry);
    }

    const merged = mergeWorkQueueEntries(demandEntries, opportunityEntries);
    const paginated = paginateWorkQueue(merged, page, limit);

    return {
      ...paginated,
      counts: workQueueCounts(demandEntries, opportunityEntries),
    };
  }

  async dismissFromReview(accountId: string, days = 30) {
    const account = await this.accountService.getById(accountId);
    if (!account) throw new Error('Account not found');
    const updated = await this.accountService.snoozeReview(accountId, days);
    return { accountId, snoozedUntil: updated?.reviewSnoozedUntil ?? null };
  }

  async rejectFromReview(accountId: string, reason?: string) {
    const account = await this.accountService.getById(accountId);
    if (!account) throw new Error('Account not found');
    await this.accountService.suppress(accountId, reason ?? 'Rejected from review queue');
    return { accountId, suppressed: true };
  }
}
