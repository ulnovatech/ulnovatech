import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import { matchBusinessForDemand } from './demand-match';
import { parseRssXml } from './parse-rss';
import { IntentRepository } from './repository';

function inferSignalType(text: string): 'help_request' | 'hiring' | 'job_post' | 'public_request' {
  const lower = text.toLowerCase();
  if (/\b(hiring|vacancy|job opening|we're looking for)\b/.test(lower)) return 'hiring';
  if (/\b(job|position|role)\b/.test(lower)) return 'job_post';
  if (/\b(need|looking for|seeking|help)\b/.test(lower)) return 'help_request';
  return 'public_request';
}

export class DemandRssService {
  private repo = new IntentRepository();

  async pollFeeds(feedUrls?: string[]) {
    await platformSettings.ensureLoaded();
    const feeds = (feedUrls ?? platformSettings.getIntentSettings().demandRssFeeds)
      .map((u: string) => u.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (feeds.length === 0) {
      return { polled: 0, created: 0, skipped: 0, errors: [] as string[] };
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const feedUrl of feeds) {
      try {
        const res = await fetch(feedUrl, {
          headers: { 'User-Agent': 'AgencyPlatformBot/1.0 (+demand-rss)' },
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = await res.text();
        const items = parseRssXml(xml);

        for (const item of items) {
          const text = `${item.title} ${item.snippet ?? ''}`;
          const signalType = inferSignalType(text);
          const businessId = await matchBusinessForDemand({
            sourceUrl: item.link,
            title: item.title,
          });

          const result = await this.repo.createDemandUnique({
            businessId: businessId ?? undefined,
            source: 'rss_feed',
            signalType,
            signalStrength: 70,
            title: item.title,
            snippet: item.snippet,
            sourceUrl: item.link,
          });

          if (result.created) created++;
          else skipped++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${feedUrl}: ${msg}`);
        logger.warn('RSS feed poll failed', { feedUrl, error: msg });
      }
    }

    logger.info('RSS demand poll complete', { feeds: feeds.length, created, skipped });
    return { polled: feeds.length, created, skipped, errors };
  }
}
