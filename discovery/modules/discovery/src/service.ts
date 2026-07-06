import { AccountService } from '@agency/accounts';
import { BudgetGovernor } from '@agency/acquisition';
import { discoverProviderTimeoutMs, logger, withTimeout } from '@agency/config';
import { isTestFixtureCountry } from '@agency/database';
import { platformSettings } from '@agency/settings';
import { DiscoveryRepository } from './repository';
import { ensureDiscoverySettings, profileToMode, type RunProfile } from './lib/run-profile';
import { getConfiguredDiscoveryProviders } from './providers/registry';
import { placesIdFromExternalId } from './providers/places/place-to-candidate';
import { GooglePlacesVerifyProvider } from './providers/places/places-verify';
import type { DiscoveredBusiness } from './providers/types';

function dedupeBusinesses(items: DiscoveredBusiness[]): DiscoveredBusiness[] {
  const seen = new Set<string>();
  const seenPlaces = new Set<string>();

  return items.filter((b) => {
    const placesId =
      placesIdFromExternalId(b.externalId) ??
      (typeof b.metadata?.placesId === 'string' ? b.metadata.placesId : undefined);

    if (placesId) {
      if (seenPlaces.has(placesId)) return false;
      seenPlaces.add(placesId);
      return true;
    }

    const key = b.externalId ?? `${b.name}|${b.city}|${b.country}|${b.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type CreateRunParams = {
  country: string;
  city: string;
  industry: string;
  profile?: RunProfile;
  prospectFocus?: boolean;
  boiNarrative?: boolean;
};

export class DiscoveryService {
  private repo = new DiscoveryRepository();
  private accounts = new AccountService();
  private placesVerify = new GooglePlacesVerifyProvider();

  async prepareRun(params: CreateRunParams) {
    if (isTestFixtureCountry(params.country)) {
      throw new Error('Invalid discovery target — test fixture countries are not allowed.');
    }
    await ensureDiscoverySettings();
    const profile = params.profile ?? 'standard';
    const mode = profileToMode(profile);
    const providers = await getConfiguredDiscoveryProviders(mode);
    if (providers.length === 0) {
      throw new Error(
        'No discovery sources are configured. Add Google Places, search credentials, Meta Graph token, or a CSV import file in Settings.',
      );
    }
    return this.repo.createRun({
      country: params.country,
      city: params.city,
      industry: params.industry,
      runProfile: profile,
      prospectFocus: params.prospectFocus ?? false,
      boiNarrative: params.boiNarrative ?? false,
    });
  }

  async executeDiscoverStage(runId: string): Promise<{
    candidates: DiscoveredBusiness[];
    providerStats: Array<{ provider: string; count: number; error?: string }>;
  }> {
    const run = await this.repo.getRun(runId);
    if (!run) throw new Error('Discovery run not found');

    const mode = profileToMode((run.runProfile as RunProfile) ?? 'standard');
    const providers = await getConfiguredDiscoveryProviders(mode);
    const params = {
      country: run.country,
      city: run.city,
      industry: run.industry,
      acquisitionMode: mode,
      prospectFocus: run.prospectFocus ?? false,
    };

    const allBusinesses: DiscoveredBusiness[] = [];
    const providerStats: Array<{ provider: string; count: number; error?: string }> = [];

    const providerTimeout = discoverProviderTimeoutMs();
    const results = await Promise.allSettled(
      providers.map(async (provider) => {
        const found = await withTimeout(
          provider.discover(params),
          providerTimeout,
          `${provider.name} discovery`,
        );
        return { provider: provider.name, found };
      }),
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const providerName = providers[i]?.name ?? 'unknown';
      if (result.status === 'rejected') {
        const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
        logger.warn('Discovery provider failed', { runId, provider: providerName, error: message });
        providerStats.push({ provider: providerName, count: 0, error: message });
        continue;
      }
      const { found } = result.value;
      allBusinesses.push(...found);
      providerStats.push({ provider: providerName, count: found.length });
      logger.info('Discovery provider completed', { provider: providerName, count: found.length, runId });
    }

    if (providerStats.every((p) => p.count === 0) && results.some((r) => r.status === 'rejected')) {
      const firstErr = results.find((r) => r.status === 'rejected');
      throw firstErr?.status === 'rejected' ? firstErr.reason : new Error('All discovery providers failed');
    }

    const unique = dedupeBusinesses(allBusinesses);
    if (unique.length === 0) {
      const providerError = providerStats.find((p) => p.error)?.error;
      if (providerError) {
        throw new Error(providerError);
      }

      await platformSettings.ensureLoaded();
      const governor = new BudgetGovernor();
      const hasPlaces = providers.some((p) => p.name === 'google_maps');
      const hasSearch = providers.some(
        (p) => p.name === 'public_search' || p.name === 'social_search',
      );

      if (hasPlaces) {
        const placesRemaining = await governor.getRemaining('google_places');
        if (placesRemaining <= 0) {
          throw new Error(
            'Google Places monthly budget is exhausted. Run `pnpm db:reset-budget` or raise PLACES_MONTHLY_CAP in Settings, then retry.',
          );
        }
      }

      if (hasSearch) {
        const cseRemaining = await governor.getRemaining('google_cse');
        const bingRemaining = await governor.getRemaining('bing_search');
        const hasCse = !!(
          platformSettings.getCredential('google_cse_api_key') &&
          platformSettings.getCredential('google_cse_cx')
        );
        const hasBing = !!platformSettings.getCredential('bing_search_key');

        if (hasCse && cseRemaining <= 0 && (!hasBing || bingRemaining <= 0)) {
          throw new Error(
            'Google Custom Search daily budget is exhausted. Raise CSE_DAILY_CAP in Settings or retry tomorrow.',
          );
        }
        if (hasBing && bingRemaining <= 0 && (!hasCse || cseRemaining <= 0)) {
          throw new Error(
            'Bing Search daily budget is exhausted. Raise BING_DAILY_CAP in Settings or retry tomorrow.',
          );
        }
      }

      throw new Error(
        'Discovery returned zero businesses. Try a narrower city (not "All cities"), a different industry, or add search/CSE credentials in Settings.',
      );
    }
    return { candidates: unique, providerStats };
  }

  async executeResolveAccountsStage(runId: string, candidates: DiscoveredBusiness[]) {
    const run = await this.repo.getRun(runId);
    if (!run) throw new Error('Discovery run not found');

    const mode = profileToMode((run.runProfile as RunProfile) ?? 'standard');
    const params = { country: run.country, city: run.city, industry: run.industry, prospectFocus: run.prospectFocus ?? false };

    let unique = dedupeBusinesses(candidates);

    if (mode !== 'economy' && (await this.placesVerify.isConfigured())) {
      const verifyResult = await this.placesVerify.verifyCandidates(
        unique,
        { ...params, acquisitionMode: mode },
        runId,
      );
      unique = dedupeBusinesses(verifyResult.candidates);
      logger.info('Places verify step', { runId, ...verifyResult });
    }

    if (unique.length === 0) {
      throw new Error(
        'Discovery returned zero businesses after verification. Try a different industry/location.',
      );
    }

    const resolved = [];
    let placesRefreshSkipped = 0;
    let suppressedSkipped = 0;
    for (const item of unique) {
      const { account, skippedPlacesRefresh } = await this.accounts.resolveOrCreate(item);
      if (skippedPlacesRefresh) placesRefreshSkipped++;
      if (await this.accounts.isSuppressed(account)) {
        suppressedSkipped++;
        logger.info('Skipping suppressed account', { accountId: account.id, name: account.canonicalName });
        continue;
      }
      resolved.push({ ...item, accountId: account.id });
    }

    if (resolved.length === 0) {
      throw new Error(
        'Discovery returned only suppressed or duplicate accounts. Adjust filters or review suppression list.',
      );
    }

    logger.info('Account resolution complete', {
      runId,
      candidates: unique.length,
      saved: resolved.length,
      suppressedSkipped,
      placesRefreshSkipped,
    });

    const saved = await this.repo.insertBusinesses(runId, resolved);
    return { businesses: saved, suppressedSkipped, candidatesAfterVerify: unique.length };
  }

  /** Synchronous path — kept for tests and manual invocation */
  async createAndRun(params: CreateRunParams) {
    const run = await this.prepareRun(params);
    await this.repo.updateRunStatus(run.id, 'running', { startedAt: new Date(), errorMessage: null });

    try {
      const { candidates } = await this.executeDiscoverStage(run.id);
      const { businesses } = await this.executeResolveAccountsStage(run.id, candidates);
      await this.repo.updateRunStatus(run.id, 'completed', { completedAt: new Date() });
      return { run: await this.repo.getRun(run.id), businesses };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.repo.updateRunStatus(run.id, 'failed', {
        completedAt: new Date(),
        errorMessage: message,
      });
      logger.error('Discovery run failed', { runId: run.id, error: message });
      throw err;
    }
  }

  listRuns() {
    return this.repo.listRuns();
  }

  getRun(id: string) {
    return this.repo.getRun(id);
  }

  listBusinesses(runId: string) {
    return this.repo.listBusinessesByRun(runId);
  }

  getBusiness(id: string) {
    return this.repo.getBusiness(id);
  }

  async wipeAllRuns() {
    return this.repo.wipeAllRuns();
  }

  async purgeTestFixtureRuns() {
    return this.repo.purgeTestFixtureRuns();
  }
}
