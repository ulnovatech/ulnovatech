import { BudgetGovernor } from '@agency/acquisition';
import { CUSTOM_SCRAPE_MIN_INTERVAL_MS, isCustomScrapeEnabled, logger } from '@agency/config';
import {
  CustomScrapeRateLimiter,
  RedditIntentProvider,
  emptyHealthState,
  isCustomScrapeDegraded,
  recordPollOutcome,
  type CustomScrapeHealthState,
} from '@agency/discovery';
import { platformSettings } from '@agency/settings';
import { matchBusinessForDemand } from './demand-match';
import { IntentRepository } from './repository';

const DEFAULT_SUBREDDITS = ['forhire', 'entrepreneur', 'smallbusiness'];

const STRENGTH: Record<string, number> = {
  help_request: 85,
  public_request: 80,
  hiring: 75,
  job_post: 72,
  pain_signal: 65,
};

export type CustomScrapeHealth = {
  enabled: boolean;
  status: 'healthy' | 'degraded' | 'disabled' | 'unknown';
  subreddits: string[];
  health: CustomScrapeHealthState;
};

export class CustomScrapeService {
  private provider = new RedditIntentProvider();
  private governor = new BudgetGovernor();
  private repo = new IntentRepository();
  private limiter = new CustomScrapeRateLimiter(CUSTOM_SCRAPE_MIN_INTERVAL_MS);

  private async getConfig() {
    await platformSettings.ensureLoaded();
    const intent = platformSettings.getIntentSettings();
    const custom = intent.customScrape ?? {
      redditSubreddits: DEFAULT_SUBREDDITS,
      health: emptyHealthState(),
    };
    return {
      subreddits: (custom.redditSubreddits.length ? custom.redditSubreddits : DEFAULT_SUBREDDITS).slice(
        0,
        5,
      ),
      health: custom.health ?? emptyHealthState(),
    };
  }

  private async persistHealth(health: CustomScrapeHealthState, subreddits: string[]) {
    await platformSettings.updateIntent({
      customScrape: { redditSubreddits: subreddits, health },
    });
  }

  async healthCheck(): Promise<CustomScrapeHealth> {
    const enabled = isCustomScrapeEnabled();
    const { subreddits, health } = await this.getConfig();

    if (!enabled) {
      return { enabled: false, status: 'disabled', subreddits, health };
    }

    let status: CustomScrapeHealth['status'] = 'unknown';
    if (health.lastSuccessAt) status = 'healthy';
    if (isCustomScrapeDegraded(health)) status = 'degraded';

    return { enabled, status, subreddits, health };
  }

  async poll() {
    if (!isCustomScrapeEnabled()) {
      return {
        skipped: true as const,
        reason: 'disabled',
        polled: 0,
        created: 0,
        skippedDupes: 0,
        errors: [] as string[],
      };
    }

    const { subreddits, health: priorHealth } = await this.getConfig();
    let created = 0;
    let skippedDupes = 0;
    const errors: string[] = [];
    let polled = 0;
    let anySuccess = false;

    for (const sub of subreddits) {
      if (!(await this.governor.canSpend('custom_scrape', 1))) {
        errors.push('custom_scrape daily budget exhausted');
        break;
      }

      await this.limiter.wait();

      try {
        const items = await this.provider.fetchSubreddit(sub);
        polled++;
        anySuccess = true;

        await this.governor.recordSpend({
          provider: 'custom_scrape',
          operation: 'reddit_listing',
          units: 1,
        });

        for (const item of items) {
          const businessId = await matchBusinessForDemand({
            sourceUrl: item.sourceUrl,
            title: item.title,
          });

          const result = await this.repo.createDemandUnique({
            businessId: businessId ?? undefined,
            source: 'reddit_custom',
            signalType: item.signalType,
            signalStrength: STRENGTH[item.signalType] ?? 70,
            title: item.title,
            snippet: item.snippet,
            sourceUrl: item.sourceUrl,
          });

          if (result.created) created++;
          else skippedDupes++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`r/${sub}: ${msg}`);
        logger.warn('Custom scrape subreddit failed', { subreddit: sub, error: msg });
      }
    }

    const pollSucceeded = anySuccess && errors.length === 0;
    const nextHealth = recordPollOutcome(
      priorHealth,
      pollSucceeded || created > 0,
      errors[0] ?? null,
    );
    await this.persistHealth(nextHealth, subreddits);

    logger.info('Custom scrape poll complete', { polled, created, skippedDupes, errors: errors.length });
    return { skipped: false as const, polled, created, skippedDupes, errors };
  }
}
