import { AccountRepository } from '@agency/accounts';
import { isBrowserAutomationEnabled, logger } from '@agency/config';
import { getDb, accounts, businesses, leadScores } from '@agency/database';
import { DiscoveryRepository } from '@agency/discovery';
import { platformSettings } from '@agency/settings';
import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { IntelligenceRepository } from '../repository';
import { BrowserCrawlService } from './browser-crawl-service';
import { isBrowserEnrichEligible } from './eligibility';

export type BrowserEnrichRunResult = {
  skipped: boolean;
  reason?: string;
  attempted: number;
  enriched: number;
  budgetBlocked: number;
  enrichedBusinessIds: string[];
};

export async function runBrowserEnrichForRun(runId: string): Promise<BrowserEnrichRunResult> {
  const discoveryRepo = new DiscoveryRepository();
  const run = await discoveryRepo.getRun(runId);
  if (!run) throw new Error('Discovery run not found');

  if (run.runProfile !== 'boost') {
    return {
      skipped: true,
      reason: 'not_boost_profile',
      attempted: 0,
      enriched: 0,
      budgetBlocked: 0,
      enrichedBusinessIds: [],
    };
  }

  if (!isBrowserAutomationEnabled()) {
    return {
      skipped: true,
      reason: 'browser_disabled',
      attempted: 0,
      enriched: 0,
      budgetBlocked: 0,
      enrichedBusinessIds: [],
    };
  }

  await platformSettings.ensureLoaded();
  const minScore = platformSettings.getSync().acquisition.places.detailsMinScore;

  const db = getDb();
  const rows = await db
    .select({
      business: businesses,
      account: accounts,
      scoreRow: leadScores,
    })
    .from(businesses)
    .innerJoin(accounts, eq(businesses.accountId, accounts.id))
    .innerJoin(leadScores, eq(leadScores.businessId, businesses.id))
    .where(
      and(
        eq(businesses.discoveryRunId, runId),
        eq(accounts.crawlStatus, 'blocked'),
        eq(leadScores.reachability, 'none'),
        gte(leadScores.score, minScore),
        isNotNull(businesses.website),
      ),
    );

  const browser = new BrowserCrawlService();
  const intelRepo = new IntelligenceRepository();
  const accountRepo = new AccountRepository();

  let attempted = 0;
  let enriched = 0;
  let budgetBlocked = 0;
  const enrichedBusinessIds: string[] = [];

  for (const row of rows) {
    const eligible = isBrowserEnrichEligible(
      {
        crawlStatus: row.account.crawlStatus,
        reachability: row.scoreRow.reachability,
        score: row.scoreRow.score,
        hasWebsite: !!row.business.website?.trim(),
      },
      minScore,
    );
    if (!eligible) continue;

    attempted++;
    const result = await browser.extractContacts(row.business.website, {
      runId,
      accountId: row.account.id,
      businessId: row.business.id,
    });

    if (result.skipped && result.reason === 'budget_exhausted') {
      budgetBlocked++;
      break;
    }

    if (!result.ok || (!result.extractedEmail && !result.extractedPhone)) continue;

    const contactPatch: { email?: string; phone?: string } = {};
    if (result.extractedEmail && !row.business.email) contactPatch.email = result.extractedEmail;
    if (result.extractedPhone && !row.business.phone) contactPatch.phone = result.extractedPhone;

    if (contactPatch.email || contactPatch.phone) {
      await intelRepo.updateBusinessContact(row.business.id, contactPatch);
    }

    const accountPatch: Record<string, unknown> = {
      metadata: {
        ...(row.account.metadata as Record<string, unknown> | null),
        browserEnrich: {
          at: new Date().toISOString(),
          pagesFetched: result.pagesFetched,
          pageUrls: result.pageUrls,
        },
      },
    };
    if (result.extractedEmail && !row.account.email) accountPatch.email = result.extractedEmail;
    if (result.extractedPhone && !row.account.phone) accountPatch.phone = result.extractedPhone;

    await accountRepo.update(row.account.id, accountPatch);
    enriched++;
    enrichedBusinessIds.push(row.business.id);
  }

  logger.info('Browser enrich complete', { runId, attempted, enriched, budgetBlocked });
  return { skipped: false, attempted, enriched, budgetBlocked, enrichedBusinessIds };
}
