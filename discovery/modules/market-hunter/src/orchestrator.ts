import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type { MarketHunterSettings } from '@agency/settings';
import { MarketHunterBudgetGuard } from './budget.guard';
import { generateActionCard, rerankActionCards, type ActionCard } from './output/action-card';
import { listingKey } from './platforms/base.adapter';
import type { PlatformAdapter } from './platforms/base.adapter';
import { setAdapterScanContext } from './platforms/adapter-context';
import { getPlatformConfig } from './platforms/platform-config';
import { getEnabledAdapters, listScanTargets } from './platforms/registry';
import type { PlatformConfigEntry } from './platforms/platform-config';
import { MarketHunterRepository } from './repository';
import { extractComplaints } from './research/claude.client';
import { getPaymentPath } from './research/llm.config';
import { computeCategoryMetrics } from './scoring/category.metrics';
import { filterGhosts } from './scoring/ghost.filter';
import { scoreListing } from './scoring/gap.scorer';
import { EMPTY_COMPLAINT_ANALYSIS, type ComplaintAnalysis } from './scoring/types';
import { checkVisibility, isEligibleForActionCard } from './scoring/visibility.checker';
import type { MarketHunterPlatformKey } from './types';

export type Type1DemandFlag = {
  platform: MarketHunterPlatformKey;
  category: string;
  title: string;
  url: string;
  signal: string;
};

export type ScanPipelineStats = {
  listingsFetched: number;
  ghostsFiltered: number;
  cardsGenerated: number;
  spendUsd: number;
  type1Flags: Type1DemandFlag[];
  byPlatform: Record<
    string,
    { listings: number; ghosts: number; cards: number; categories: number; type1Signals?: number }
  >;
};

export type OrchestratorDeps = {
  repo?: MarketHunterRepository;
  settings?: MarketHunterSettings;
  scanTargets?: Array<{
    platform: MarketHunterPlatformKey;
    category: string;
    config: PlatformConfigEntry;
  }>;
  extractComplaintsFn?: typeof extractComplaints;
  getReviewTexts?: (adapter: PlatformAdapter, listingId: string, url: string) => Promise<string[]>;
};

function bumpPlatformStats(
  stats: ScanPipelineStats,
  platform: string,
  field: 'listings' | 'ghosts' | 'cards' | 'categories',
  amount = 1,
) {
  if (!stats.byPlatform[platform]) {
    stats.byPlatform[platform] = { listings: 0, ghosts: 0, cards: 0, categories: 0 };
  }
  stats.byPlatform[platform][field] += amount;
}

async function resolveReviewTexts(
  adapter: PlatformAdapter,
  listing: { id: string; url: string; rawReviewText?: string[] },
  deps: OrchestratorDeps,
): Promise<string[]> {
  const embedded = listing.rawReviewText?.filter((t) => t.trim()) ?? [];
  if (embedded.length > 0) return embedded;

  if (deps.getReviewTexts) {
    return deps.getReviewTexts(adapter, listing.id, listing.url);
  }

  try {
    return await adapter.getReviews(listing.url || listing.id);
  } catch (err) {
    logger.warn('Review fetch failed for listing', {
      platform: adapter.platformKey,
      listingId: listing.id,
      error: String(err),
    });
    return [];
  }
}

async function resolveComplaints(
  productTitle: string,
  reviewTexts: string[],
  ctx: { scanId: string; spendGuard: MarketHunterBudgetGuard },
  deps: OrchestratorDeps,
): Promise<ComplaintAnalysis> {
  if (reviewTexts.length === 0) {
    return EMPTY_COMPLAINT_ANALYSIS;
  }

  const extract = deps.extractComplaintsFn ?? extractComplaints;
  try {
    return await extract(productTitle, reviewTexts, {
      scanId: ctx.scanId,
      spendGuard: ctx.spendGuard,
      operation: `claude_${productTitle.slice(0, 32)}`,
    });
  } catch (err) {
    logger.warn('Claude complaint extraction skipped', {
      scanId: ctx.scanId,
      productTitle,
      error: String(err),
    });
    return EMPTY_COMPLAINT_ANALYSIS;
  }
}

function wireAdapterContext(scanId: string, spendGuard: MarketHunterBudgetGuard) {
  setAdapterScanContext({ scanId, spendGuard });
}

async function collectType1Signals(
  scanId: string,
  targets: Array<{ platform: MarketHunterPlatformKey; category: string }>,
  adapterByKey: Map<MarketHunterPlatformKey, PlatformAdapter>,
  mh: MarketHunterSettings,
  repo: MarketHunterRepository,
  spendGuard: MarketHunterBudgetGuard,
  stats: ScanPipelineStats,
): Promise<void> {
  for (const target of targets) {
    const config = getPlatformConfig(target.platform);
    if (config.supportsGapScoring) continue;

    const adapter = adapterByKey.get(target.platform);
    if (!adapter) continue;
    if (!(await spendGuard.canSpend(0))) break;

    bumpPlatformStats(stats, target.platform, 'categories');

    let listings;
    try {
      listings = await adapter.fetchListings({
        category: target.category,
        limit: Math.min(mh.defaultListingLimit, 15),
      });
    } catch (err) {
      logger.warn('Type-1 signal fetch failed', {
        scanId,
        platform: target.platform,
        category: target.category,
        error: String(err),
      });
      continue;
    }

    stats.listingsFetched += listings.length;
    bumpPlatformStats(stats, target.platform, 'listings', listings.length);

    if (!stats.byPlatform[target.platform]) {
      stats.byPlatform[target.platform] = { listings: 0, ghosts: 0, cards: 0, categories: 0 };
    }
    stats.byPlatform[target.platform].type1Signals =
      (stats.byPlatform[target.platform].type1Signals ?? 0) + listings.length;

    if (listings.length > 0) {
      await repo.saveListings(scanId, listings);
    }

    for (const listing of listings) {
      stats.type1Flags.push({
        platform: target.platform,
        category: target.category,
        title: listing.title,
        url: listing.url,
        signal: listing.tags.length > 0 ? listing.tags.join(', ') : listing.title,
      });
    }
  }
}

export async function runScanPipeline(
  scanId: string,
  deps: OrchestratorDeps = {},
): Promise<{ cards: ActionCard[]; stats: ScanPipelineStats }> {
  await platformSettings.ensureLoaded();
  const mh = deps.settings ?? platformSettings.getSync().marketHunter;
  if (!mh.enabled) {
    throw new Error('Market Hunter is disabled in settings');
  }

  const repo = deps.repo ?? new MarketHunterRepository();
  const spendGuard = new MarketHunterBudgetGuard(scanId, repo);
  wireAdapterContext(scanId, spendGuard);

  const stats: ScanPipelineStats = {
    listingsFetched: 0,
    ghostsFiltered: 0,
    cardsGenerated: 0,
    spendUsd: 0,
    type1Flags: [],
    byPlatform: {},
  };

  const draftCards: ActionCard[] = [];
  const targets = deps.scanTargets ?? listScanTargets(mh);
  const adapters = getEnabledAdapters(mh);
  const adapterByKey = new Map(adapters.map((a) => [a.platformKey, a]));

  for (const target of targets) {
    const adapter = adapterByKey.get(target.platform);
    if (!adapter) continue;

    const config = getPlatformConfig(target.platform);
    if (!config.supportsGapScoring) continue;

    if (!(await spendGuard.canSpend(0))) break;

    bumpPlatformStats(stats, target.platform, 'categories');

    let listings;
    try {
      listings = await adapter.fetchListings({
        category: target.category,
        limit: mh.defaultListingLimit,
      });
    } catch (err) {
      logger.warn('Listing fetch failed', {
        scanId,
        platform: target.platform,
        category: target.category,
        error: String(err),
      });
      continue;
    }

    stats.listingsFetched += listings.length;
    bumpPlatformStats(stats, target.platform, 'listings', listings.length);

    if (listings.length > 0) {
      await repo.saveListings(scanId, listings);
    }

    const categoryMetrics = computeCategoryMetrics(listings);
    const { passed, ghosts } = filterGhosts(listings);
    stats.ghostsFiltered += ghosts.length;
    bumpPlatformStats(stats, target.platform, 'ghosts', ghosts.length);

    for (const listing of passed) {
      if (!(await spendGuard.canSpend(0))) break;

      const reviewTexts = await resolveReviewTexts(adapter, listing, deps);
      const complaints = await resolveComplaints(listing.title, reviewTexts, { scanId, spendGuard }, deps);

      const mechanics = adapter.getVisibilityMechanics();
      let gap = scoreListing(listing, complaints, mechanics);

      if (gap.type === 'NONE' && reviewTexts.length > 0 && complaints.topComplaints.length === 0) {
        gap = scoreListing(listing, EMPTY_COMPLAINT_ANALYSIS, mechanics);
      }

      if (gap.type === 'NONE') continue;

      const visibility = checkVisibility(
        target.platform as MarketHunterPlatformKey,
        mechanics,
        categoryMetrics.listingCount,
      );

      if (!isEligibleForActionCard(gap.type, visibility)) continue;

      draftCards.push(
        generateActionCard({
          listing,
          gapScore: gap,
          complaints,
          visibility,
          platform: target.platform,
          rank: draftCards.length + 1,
          listingKey: listingKey(listing),
          paymentPath: getPaymentPath(),
        }),
      );
      bumpPlatformStats(stats, target.platform, 'cards');
    }
  }

  await collectType1Signals(
    scanId,
    targets.map((t) => ({ platform: t.platform, category: t.category })),
    adapterByKey,
    mh,
    repo,
    spendGuard,
    stats,
  );

  const cards = rerankActionCards(draftCards);
  stats.cardsGenerated = cards.length;
  stats.spendUsd = await spendGuard.getCurrentSpendUsd();

  return { cards, stats };
}
