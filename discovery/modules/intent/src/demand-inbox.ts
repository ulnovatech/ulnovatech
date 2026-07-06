import { AccountService } from '@agency/accounts';
import { DiscoveryRepository } from '@agency/discovery';
import { DEMAND_INGEST_RUN_ID } from './demand-ingest-run';
import { hashSourceUrl, parseProspectFromSignal, type CreateProspectInput } from './parse-prospect';
import { IntentRepository } from './repository';

export type OrphanDemandItem = {
  id: string;
  source: string;
  signalType: string;
  signalStrength: number;
  title: string | null;
  snippet: string | null;
  sourceUrl: string | null;
  capturedAt: Date;
};

export class DemandInboxService {
  private repo = new IntentRepository();
  private accounts = new AccountService();
  private discovery = new DiscoveryRepository();

  async list({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
    return this.repo.listOrphanDemand({ page, limit });
  }

  async dismiss(signalId: string) {
    const signal = await this.repo.findById(signalId);
    if (!signal) throw new Error('Signal not found');
    if (signal.signalClass !== 'demand') throw new Error('Not a demand signal');
    if (signal.businessId) throw new Error('Signal is already linked to a business');
    if (signal.dismissedAt) return { signalId, dismissedAt: signal.dismissedAt };

    const dismissed = await this.repo.dismissSignal(signalId);
    return { signalId, dismissedAt: dismissed.dismissedAt };
  }

  async matchToBusiness(signalId: string, businessId: string) {
    const signal = await this.requireOrphanDemand(signalId);
    const business = await this.discovery.getBusiness(businessId);
    if (!business) throw new Error('Business not found');

    await this.repo.linkSignalToBusiness(signalId, businessId);
    return {
      signalId,
      businessId,
      accountId: business.accountId,
    };
  }

  async createProspect(signalId: string, input: CreateProspectInput = {}) {
    const signal = await this.requireOrphanDemand(signalId);
    if (!signal.sourceUrl) throw new Error('Signal has no source URL');

    const run = await this.discovery.getRun(DEMAND_INGEST_RUN_ID);
    if (!run) {
      throw new Error('Demand ingest run not seeded — run pnpm db:migrate');
    }

    const prospect = parseProspectFromSignal(
      { title: signal.title, snippet: signal.snippet },
      input,
    );
    const externalId = hashSourceUrl(signal.sourceUrl);

    const { account, created: accountCreated } = await this.accounts.resolveOrCreate({
      name: prospect.name,
      source: 'demand_inbox',
      externalId,
      industry: prospect.industry,
      website: prospect.website,
      city: prospect.city,
      country: prospect.country,
      sourceUrl: signal.sourceUrl,
      metadata: { fromDemandSignalId: signalId },
    });

    const [business] = await this.discovery.insertBusinesses(run.id, [
      {
        accountId: account.id,
        name: prospect.name,
        industry: prospect.industry,
        website: prospect.website,
        city: prospect.city,
        country: prospect.country,
        source: 'demand_inbox',
        sourceUrl: signal.sourceUrl,
        externalId,
      },
    ]);

    if (!business) throw new Error('Failed to create business row');

    await this.repo.linkSignalToBusiness(signalId, business.id);

    return {
      signalId,
      businessId: business.id,
      accountId: account.id,
      accountCreated,
      reviewUrl: '/review',
    };
  }

  private async requireOrphanDemand(signalId: string) {
    const signal = await this.repo.findById(signalId);
    if (!signal) throw new Error('Signal not found');
    if (signal.signalClass !== 'demand') throw new Error('Not a demand signal');
    if (signal.businessId) throw new Error('Signal is already linked to a business');
    if (signal.dismissedAt) throw new Error('Signal was dismissed');
    return signal;
  }
}
