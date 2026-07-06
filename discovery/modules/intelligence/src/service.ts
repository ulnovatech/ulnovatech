import { AccountRepository } from '@agency/accounts';

import { logger } from '@agency/config';

import { DiscoveryRepository } from '@agency/discovery';
import { mapWithConcurrency, pipelineConcurrency } from '@agency/config';

import { analyzeWebsite } from './analyzer';
import { BiProfileService } from './bi/bi-profile-service';

import { IntelligenceRepository } from './repository';



export class IntelligenceService {

  private repo = new IntelligenceRepository();

  private discoveryRepo = new DiscoveryRepository();

  private accountRepo = new AccountRepository();
  private biProfiles = new BiProfileService();



  async analyzeBusiness(businessId: string, runId?: string) {

    const business = await this.discoveryRepo.getBusiness(businessId);

    if (!business) throw new Error('Business not found');



    const result = await analyzeWebsite(business.website, {

      businessId,

      accountId: business.accountId ?? undefined,

      runId,

    });



    const analysis = await this.repo.upsertAnalysis({

      businessId,

      hasWebsite: result.hasWebsite,

      mobileFriendly: result.mobileFriendly,

      httpsEnabled: result.httpsEnabled,

      performanceScore: null,

      notes: result.notes,

    });



    const contactPatch: { email?: string; phone?: string } = {};

    if (result.extractedEmail && !business.email) contactPatch.email = result.extractedEmail;

    if (result.extractedPhone && !business.phone) contactPatch.phone = result.extractedPhone;



    if (contactPatch.email || contactPatch.phone) {

      await this.repo.updateBusinessContact(businessId, contactPatch);

    }



    if (business.accountId) {

      const account = await this.accountRepo.getById(business.accountId);

      const accountPatch: Record<string, unknown> = {

        lastCrawledAt: new Date(),

        crawlStatus: result.crawlStatus,

        metadata: {

          ...(account?.metadata as Record<string, unknown> | null),

          crawl: {

            pagesFetched: result.pagesFetched,

            pageUrls: result.pageUrls,

            title: result.title,

            metaDescription: result.metaDescription,

            whatsappUrl: result.whatsappUrl,

            tiktokUrl: result.tiktokUrl,

            linkedinUrl: result.linkedinUrl,

            youtubeUrl: result.youtubeUrl,

            twitterUrl: result.twitterUrl,

            socialUrls: result.socialUrls,

            linkInBioUrls: result.linkInBioUrls,

            infrastructureAudit: result.infrastructureAudit,

          },

        },

      };



      if (result.extractedEmail && !account?.email) accountPatch.email = result.extractedEmail;

      if (result.extractedPhone && !account?.phone) accountPatch.phone = result.extractedPhone;

      if (result.facebookUrl && !account?.facebookUrl) accountPatch.facebookUrl = result.facebookUrl;

      if (result.instagramUrl && !account?.instagramUrl) accountPatch.instagramUrl = result.instagramUrl;

      await this.accountRepo.update(business.accountId, accountPatch);

    }



    logger.info('Website crawl complete', {

      businessId,

      crawlStatus: result.crawlStatus,

      pagesFetched: result.pagesFetched,

    });

    return analysis;

  }



  async analyzeRunBusinesses(runId: string) {
    const businesses = await this.discoveryRepo.listBusinessesByRun(runId);
    const concurrency = pipelineConcurrency();
    const results = await mapWithConcurrency(businesses, concurrency, (b) =>
      this.analyzeBusiness(b.id, runId),
    );
    return { analyzed: results.length };
  }



  getAnalysis(businessId: string) {

    return this.repo.getAnalysis(businessId);

  }

  async browserEnrichRun(runId: string) {
    const { runBrowserEnrichForRun } = await import('./browser/run-browser-enrich');
    return runBrowserEnrichForRun(runId);
  }

  async biEnrichRun(runId: string) {
    return this.biProfiles.enrichRun(runId);
  }

  getBiProfileByBusinessId(businessId: string) {
    return this.biProfiles.getByBusinessId(businessId);
  }

  patchPlacesReviewSignalsForRun(runId: string) {
    return this.biProfiles.patchPlacesReviewSignalsForRun(runId);
  }

  biRefreshBusinesses(businessIds: string[], discoveryRunId?: string) {
    return this.biProfiles.refreshBusinesses(businessIds, discoveryRunId);
  }

  synthesizeBoiForBusinesses(businessIds: string[], discoveryRunId?: string) {
    return this.biProfiles.synthesizeBusinesses(businessIds, discoveryRunId);
  }

  getOpportunityBrief(businessId: string) {
    return this.biProfiles.getOpportunityBrief(businessId);
  }
}


