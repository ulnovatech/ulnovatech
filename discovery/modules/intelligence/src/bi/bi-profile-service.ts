import { AccountRepository } from '@agency/accounts';
import { logger, mapWithConcurrency, pipelineConcurrency } from '@agency/config';
import { DiscoveryRepository } from '@agency/discovery';
import { IntelligenceRepository } from '../repository';
import { buildBusinessIntelligenceProfile, readCrawlFootprintSources } from './build-profile';
import { buildRelationshipGraph } from './build-relationship-graph';
import { computeBiCompleteness } from './compute-completeness';
import { normalizeBusinessIntelligenceProfile } from '../boi/normalize-bi-profile';
import { synthesizeOpportunityIntelligence } from '../boi/synthesize-opportunity-intelligence';
import { maybeEnhanceBoiNarrative } from '../boi/llm-narrative';
import { fetchPageSpeedIfConfigured } from '../boi/fetch-page-speed';
import {
  buildOpportunityBriefPayload,
  writeBoiToProfile,
  type BoIOpportunityBriefPayload,
} from '../boi/boi-repository';
import {
  buildBusinessSignalsFromReviews,
  readPlacesReviewsFromMetadata,
} from '@agency/discovery';
import { BiProfileRepository } from './bi-profile-repository';
import { enrichDigitalFootprint } from './link-in-bio';
import type { BiEnrichRunResult, BusinessIntelligenceProfile } from './types';

async function attachBoiSynthesis(
  profile: BusinessIntelligenceProfile,
  discoveryRunId?: string,
  discoveryRepo?: DiscoveryRepository,
): Promise<BusinessIntelligenceProfile> {
  const pageSpeed = await fetchPageSpeedIfConfigured(profile);
  const rulesBoi = synthesizeOpportunityIntelligence({ profile, pageSpeed });
  let boi = rulesBoi;

  if (discoveryRunId) {
    const repo = discoveryRepo ?? new DiscoveryRepository();
    const run = await repo.getRun(discoveryRunId);
    if (run?.boiNarrative) {
      boi = await maybeEnhanceBoiNarrative({
        profile,
        boi: rulesBoi,
        runId: discoveryRunId,
        accountId: profile.accountId,
        boiNarrativeRequested: true,
      });
    }
  }

  const withBoi = writeBoiToProfile(profile, boi);
  return {
    ...withBoi,
    completeness: computeBiCompleteness(withBoi),
  };
}

export class BiProfileService {
  private biRepo = new BiProfileRepository();
  private intelRepo = new IntelligenceRepository();
  private discoveryRepo = new DiscoveryRepository();
  private accountRepo = new AccountRepository();

  async enrichBusiness(businessId: string, discoveryRunId?: string): Promise<BusinessIntelligenceProfile | null> {
    const business = await this.discoveryRepo.getBusiness(businessId);
    if (!business) throw new Error('Business not found');
    if (!business.accountId) return null;

    const account = await this.accountRepo.getById(business.accountId);
    if (!account) return null;

    const analysis = await this.intelRepo.getAnalysis(businessId);
    const runId = discoveryRunId ?? business.discoveryRunId;
    const baseSocial = buildBusinessIntelligenceProfile({
      account,
      business,
      analysis,
      discoveryRunId: runId,
    }).digitalFootprint.socialLinks;

    const crawlSources = readCrawlFootprintSources(account, business.website ?? account.website);
    const footprint = await enrichDigitalFootprint({
      socialLinks: baseSocial,
      website: crawlSources.website,
      crawlSocialUrls: crawlSources.crawlSocialUrls,
      crawlLinkInBioUrls: crawlSources.crawlLinkInBioUrls,
    });

    const relationshipGraph = buildRelationshipGraph({
      profile: buildBusinessIntelligenceProfile({
        account,
        business,
        analysis,
        discoveryRunId: runId,
        footprint: {
          socialLinks: footprint.socialLinks,
          linkInBioPages: footprint.linkInBioPages,
          relationshipGraph: { nodes: [], edges: [] },
        },
      }),
      linkInBioPages: footprint.linkInBioPages,
    });

    let profile = buildBusinessIntelligenceProfile({
      account,
      business,
      analysis,
      discoveryRunId: runId,
      footprint: {
        socialLinks: footprint.socialLinks,
        linkInBioPages: footprint.linkInBioPages,
        relationshipGraph,
      },
    });

    if (footprint.resolvedWebsite && !profile.contact.website) {
      profile = {
        ...profile,
        contact: { ...profile.contact, website: footprint.resolvedWebsite },
      };
    }

    profile = await attachBoiSynthesis(profile, runId, this.discoveryRepo);

    await this.biRepo.upsert({
      accountId: account.id,
      businessId: business.id,
      discoveryRunId: runId,
      profile,
      completenessScore: profile.completeness.score,
    });

    await this.accountRepo.update(account.id, {
      lastEnrichedAt: new Date(),
      metadata: {
        ...(account.metadata as Record<string, unknown> | null),
        biProfile: {
          completenessScore: profile.completeness.score,
          enrichedAt: profile.enrichedAt,
          socialLinkCount: profile.digitalFootprint.socialLinks.length,
          linkInBioPageCount: profile.digitalFootprint.linkInBioPages.length,
          graphNodeCount: profile.digitalFootprint.relationshipGraph.nodes.length,
          infrastructureOpportunities: profile.infrastructure.opportunityFlags,
          hasAnalytics: profile.infrastructure.flags.hasAnalytics,
          hasEmailCapture: profile.infrastructure.flags.hasEmailCapture,
          hasOnlineBooking: profile.infrastructure.flags.hasOnlineBooking,
        },
      },
    });

    return profile;
  }

  async refreshBusinesses(
    businessIds: string[],
    discoveryRunId?: string,
  ): Promise<{ refreshed: number; skipped: number }> {
    const unique = [...new Set(businessIds.filter(Boolean))];
    if (unique.length === 0) return { refreshed: 0, skipped: 0 };

    let refreshed = 0;
    let skipped = 0;
    const concurrency = pipelineConcurrency();

    const outcomes = await mapWithConcurrency(unique, concurrency, async (businessId) => {
      const profile = await this.enrichBusiness(businessId, discoveryRunId);
      return profile ? 'ok' : 'skip';
    });

    for (const outcome of outcomes) {
      if (outcome === 'ok') refreshed++;
      else skipped++;
    }

    logger.info('BI refresh after late enrichment', {
      discoveryRunId,
      requested: unique.length,
      refreshed,
      skipped,
    });

    return { refreshed, skipped };
  }

  async enrichRun(runId: string): Promise<BiEnrichRunResult> {
    const businesses = await this.discoveryRepo.listBusinessesByRun(runId);
    let enriched = 0;
    let skippedNoAccount = 0;
    let completenessTotal = 0;
    let linkInBioResolved = 0;
    const concurrency = pipelineConcurrency();

    const outcomes = await mapWithConcurrency(businesses, concurrency, async (business) => {
      if (!business.accountId) {
        return { kind: 'skip' as const };
      }
      const profile = await this.enrichBusiness(business.id, runId);
      if (!profile) return { kind: 'skip' as const };
      return {
        kind: 'ok' as const,
        completeness: profile.completeness.score,
        linkInBioResolved: profile.digitalFootprint.linkInBioPages.filter((p) => p.fetchStatus === 'ok')
          .length,
      };
    });

    for (const outcome of outcomes) {
      if (outcome.kind === 'skip') {
        skippedNoAccount++;
        continue;
      }
      enriched++;
      completenessTotal += outcome.completeness;
      linkInBioResolved += outcome.linkInBioResolved;
    }

    const averageCompleteness = enriched > 0 ? Math.round(completenessTotal / enriched) : 0;

    logger.info('BI enrich run complete', {
      runId,
      enriched,
      skippedNoAccount,
      averageCompleteness,
      linkInBioResolved,
    });

    return { enriched, skippedNoAccount, averageCompleteness, linkInBioResolved };
  }

  async patchPlacesReviewSignalsForRun(runId: string): Promise<{ patched: number; skipped: number }> {
    const businesses = await this.discoveryRepo.listBusinessesByRun(runId);
    let patched = 0;
    let skipped = 0;

    for (const business of businesses) {
      if (!business.accountId) {
        skipped++;
        continue;
      }

      const reviews = readPlacesReviewsFromMetadata(
        business.metadata as Record<string, unknown> | null,
      );
      if (reviews.length === 0) {
        skipped++;
        continue;
      }

      const row = await this.biRepo.getByBusinessId(business.id);
      if (!row?.profile) {
        skipped++;
        continue;
      }

      const profile = normalizeBusinessIntelligenceProfile(row.profile) as BusinessIntelligenceProfile;
      if (!profile) {
        skipped++;
        continue;
      }

      const businessSignals = buildBusinessSignalsFromReviews(reviews);
      const merged: Omit<BusinessIntelligenceProfile, 'completeness'> = {
        ...profile,
        businessSignals,
        enrichedAt: new Date().toISOString(),
      };

      const withBoi = await attachBoiSynthesis(
        {
          ...merged,
          completeness: computeBiCompleteness(merged),
        },
        runId,
        this.discoveryRepo,
      );

      await this.biRepo.upsert({
        accountId: business.accountId,
        businessId: business.id,
        discoveryRunId: runId,
        profile: withBoi,
        completenessScore: withBoi.completeness.score,
      });

      const account = await this.accountRepo.getById(business.accountId);
      if (account) {
        const priorMeta = (account.metadata as Record<string, unknown> | null) ?? {};
        const priorBi = (priorMeta.biProfile as Record<string, unknown> | undefined) ?? {};
        await this.accountRepo.update(business.accountId, {
          metadata: {
            ...priorMeta,
            biProfile: {
              ...priorBi,
              reviewSnippetCount: businessSignals.reviewSnippets.length,
              reviewPainKeywordCount: businessSignals.painKeywords.length,
              reviewSignalsPatchedAt: new Date().toISOString(),
            },
          },
        });
      }

      patched++;
    }

    logger.info('Places review BI patch complete', { runId, patched, skipped });
    return { patched, skipped };
  }

  /**
   * Re-synthesize BOI from stored BI profiles (post-places rescore / late enrichment).
   */
  async synthesizeBusinesses(
    businessIds: string[],
    discoveryRunId?: string,
  ): Promise<{ synthesized: number; skipped: number }> {
    const unique = [...new Set(businessIds.filter(Boolean))];
    if (unique.length === 0) return { synthesized: 0, skipped: 0 };

    let synthesized = 0;
    let skipped = 0;
    const concurrency = pipelineConcurrency();

    const outcomes = await mapWithConcurrency(unique, concurrency, async (businessId) => {
      const row = await this.biRepo.getByBusinessId(businessId);
      if (!row?.profile || !row.accountId) return 'skip' as const;

      const profile = normalizeBusinessIntelligenceProfile(row.profile);
      if (!profile) return 'skip' as const;

      const withBoi = await attachBoiSynthesis(profile, discoveryRunId, this.discoveryRepo);
      await this.biRepo.upsert({
        accountId: row.accountId,
        businessId,
        discoveryRunId: discoveryRunId ?? row.discoveryRunId ?? profile.discoveryRunId,
        profile: withBoi,
        completenessScore: withBoi.completeness.score,
      });
      return 'ok' as const;
    });

    for (const outcome of outcomes) {
      if (outcome === 'ok') synthesized++;
      else skipped++;
    }

    logger.info('BOI re-synthesis complete', {
      discoveryRunId,
      requested: unique.length,
      synthesized,
      skipped,
    });

    return { synthesized, skipped };
  }

  async getOpportunityBrief(businessId: string): Promise<BoIOpportunityBriefPayload> {
    const row = await this.biRepo.getByBusinessId(businessId);
    if (!row?.profile) {
      throw new Error('Business intelligence profile not found');
    }

    const profile = normalizeBusinessIntelligenceProfile(row.profile);
    if (!profile) {
      throw new Error('Business intelligence profile not found');
    }

    const payload = buildOpportunityBriefPayload(profile);
    if (!payload) {
      throw new Error('Business opportunity intelligence not available yet');
    }

    return payload;
  }

  getByBusinessId(businessId: string) {
    return this.biRepo.getByBusinessId(businessId).then((row) => {
      if (!row?.profile) return row;
      const profile = normalizeBusinessIntelligenceProfile(row.profile);
      if (!profile) return row;
      return { ...row, profile };
    });
  }

  getByAccountId(accountId: string) {
    return this.biRepo.getByAccountId(accountId).then((row) => {
      if (!row?.profile) return row;
      const profile = normalizeBusinessIntelligenceProfile(row.profile);
      if (!profile) return row;
      return { ...row, profile };
    });
  }
}
