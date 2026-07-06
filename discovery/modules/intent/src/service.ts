import { CustomScrapeService } from './custom-scrape-service';
import { DemandInboxService } from './demand-inbox';
import { DemandIngestService } from './demand-ingest';
import type { CreateProspectInput } from './parse-prospect';
import { DemandRssService } from './demand-rss';
import { IntentDerivationService } from './derive-signals';
import { IntentRepository } from './repository';
import type { PasteDemandInput, SignalClass } from './types';

export class IntentService {
  private repo = new IntentRepository();
  private derivation = new IntentDerivationService();
  private demandIngest = new DemandIngestService();
  private demandInbox = new DemandInboxService();
  private demandRss = new DemandRssService();
  private customScrape = new CustomScrapeService();

  createSignal(data: {
    businessId: string;
    source: string;
    signalType: string;
    signalStrength: number;
    signalClass?: SignalClass;
    title?: string;
    snippet?: string;
    sourceUrl?: string;
  }) {
    return this.repo.create(data);
  }

  ingestPaste(input: PasteDemandInput) {
    return this.demandIngest.ingestPaste(input);
  }

  pollRssFeeds(feedUrls?: string[]) {
    return this.demandRss.pollFeeds(feedUrls);
  }

  customScrapeHealth() {
    return this.customScrape.healthCheck();
  }

  pollCustomScrape() {
    return this.customScrape.poll();
  }

  listByBusiness(businessId: string) {
    return this.repo.listByBusiness(businessId);
  }

  deriveSignalsForRun(discoveryRunId: string) {
    return this.derivation.deriveForRun(discoveryRunId);
  }

  deriveReviewPainSignalsForRun(discoveryRunId: string) {
    return this.derivation.deriveReviewPainSignalsForRun(discoveryRunId);
  }

  getMaxStrength(businessId: string) {
    return this.repo.maxStrengthForBusiness(businessId);
  }

  getStrengthByClass(businessId: string) {
    return this.repo.strengthByClassForBusiness(businessId);
  }

  getSignalCounts(businessId: string) {
    return this.repo.countByClassForBusiness(businessId);
  }

  listOrphanDemand(params?: { page?: number; limit?: number }) {
    return this.demandInbox.list(params);
  }

  dismissOrphanDemand(signalId: string) {
    return this.demandInbox.dismiss(signalId);
  }

  matchDemandToBusiness(signalId: string, businessId: string) {
    return this.demandInbox.matchToBusiness(signalId, businessId);
  }

  createProspectFromDemand(signalId: string, input?: CreateProspectInput) {
    return this.demandInbox.createProspect(signalId, input);
  }
}
