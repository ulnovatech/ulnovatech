import {
  discoveryTargetCandidates,
  logger,
  mapWithConcurrency,
  publicSearchQueryConcurrency,
} from '@agency/config';
import type { SearchResultItem } from './parse-search-results';
import { SearchApiClient, type SearchApiCallError } from './search-api-client';
import { SearchApiError } from './search-api-error';
import type { DiscoveredBusiness, DiscoverySearchParams } from './types';

export type SearchDiscoverStats = {
  businesses: DiscoveredBusiness[];
  /** Queries generated for this pass */
  queriesPlanned: number;
  /** Queries that actually ran (may be less when target/budget stops early) */
  queriesExecuted: number;
  apiCalls: number;
  cseCalls: number;
  bingCalls: number;
  dropped: number;
  budgetExhausted: boolean;
  targetReached: boolean;
  target: number;
  concurrency: number;
  errors: SearchApiCallError[];
};

export type RunParallelSearchDiscoverOpts = {
  params: DiscoverySearchParams;
  queries: string[];
  maxPages: number;
  logContext: string;
  client: SearchApiClient;
  parseItem: (
    item: SearchResultItem,
    query: string,
    params: DiscoverySearchParams,
  ) => DiscoveredBusiness | null;
  target?: number;
  concurrency?: number;
};

/**
 * Runs CSE/Bing queries in parallel with shared dedupe, budget tracking, and early exit
 * once enough keepable candidates are collected.
 */
export async function runParallelSearchDiscover(
  opts: RunParallelSearchDiscoverOpts,
): Promise<SearchDiscoverStats> {
  const {
    params,
    queries,
    maxPages,
    logContext,
    client,
    parseItem,
    target = discoveryTargetCandidates(),
    concurrency = publicSearchQueryConcurrency(),
  } = opts;

  const state = {
    seen: new Set<string>(),
    results: [] as DiscoveredBusiness[],
    apiCalls: 0,
    cseCalls: 0,
    bingCalls: 0,
    dropped: 0,
    budgetExhausted: false,
    queriesExecuted: 0,
    errors: [] as SearchApiCallError[],
    fatalError: null as Error | null,
  };

  const shouldStop = () =>
    state.fatalError != null ||
    state.budgetExhausted ||
    state.results.length >= target;

  const runQuery = async (query: string) => {
    if (shouldStop()) return;

    state.queriesExecuted++;

    try {
      const searched = await client.searchQuery(query, {
        maxPages,
        country: params.country,
      });

      state.apiCalls += searched.cseCalls + searched.bingCalls;
      state.cseCalls += searched.cseCalls;
      state.bingCalls += searched.bingCalls;
      state.budgetExhausted = state.budgetExhausted || searched.budgetExhausted;
      state.errors.push(...searched.errors);

      if (searched.items.length === 0) {
        logger.info('Search query returned no results', { logContext, query });
        return;
      }

      for (const item of searched.items) {
        if (state.results.length >= target) break;

        const mapped = parseItem(item, query, params);
        if (!mapped?.externalId) {
          state.dropped++;
          continue;
        }
        if (state.seen.has(mapped.externalId)) continue;
        state.seen.add(mapped.externalId);
        state.results.push(mapped);
      }
    } catch (err) {
      if (err instanceof SearchApiError) {
        logger.warn('Search query hard failure', { logContext, query, error: err.message });
        state.fatalError = err;
        return;
      }
      throw err;
    }
  };

  logger.info('Parallel search discovery started', {
    logContext,
    queryCount: queries.length,
    maxPages,
    target,
    concurrency,
  });

  await mapWithConcurrency(queries, concurrency, (query) => runQuery(query));

  const targetReached = state.results.length >= target;

  if (state.fatalError && state.results.length === 0) {
    throw state.fatalError;
  }

  logger.info('Parallel search discovery complete', {
    logContext,
    count: state.results.length,
    queriesPlanned: queries.length,
    queriesExecuted: state.queriesExecuted,
    apiCalls: state.apiCalls,
    cseCalls: state.cseCalls,
    bingCalls: state.bingCalls,
    dropped: state.dropped,
    budgetExhausted: state.budgetExhausted,
    targetReached,
    errorCount: state.errors.length,
  });

  return {
    businesses: state.results.slice(0, target),
    queriesPlanned: queries.length,
    queriesExecuted: state.queriesExecuted,
    apiCalls: state.apiCalls,
    cseCalls: state.cseCalls,
    bingCalls: state.bingCalls,
    dropped: state.dropped,
    budgetExhausted: state.budgetExhausted,
    targetReached,
    target,
    concurrency,
    errors: state.errors,
  };
}
