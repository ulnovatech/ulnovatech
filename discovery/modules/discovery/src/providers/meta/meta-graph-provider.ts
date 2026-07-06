import { BudgetGovernor } from '@agency/acquisition';
import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import { buildMetaSearchQueries } from '../../lib/build-meta-search-queries';
import { getMetaGraphPagesPerQuery, getMetaGraphQueryLimit } from '../../lib/run-profile';
import type { DiscoveredBusiness, DiscoveryProvider, DiscoverySearchParams } from '../types';
import { MetaGraphApiError, MetaGraphClient } from './meta-graph-client';
import { mapMetaPageToDiscoveredBusiness, mapMetaPlaceToDiscoveredBusiness } from './map-meta-result';

export type MetaGraphDiscoverStats = {
  businesses: DiscoveredBusiness[];
  queriesRun: number;
  apiCalls: number;
  pagesFound: number;
  placesFound: number;
  capped: boolean;
};

export class MetaGraphDiscoveryProvider implements DiscoveryProvider {
  readonly name = 'facebook' as const;
  readonly label = 'Meta Graph (Facebook + Instagram)';

  private client = new MetaGraphClient();
  private governor = new BudgetGovernor();

  async isConfigured(): Promise<boolean> {
    await platformSettings.ensureLoaded();
    return this.client.isConfigured();
  }

  async discover(params: DiscoverySearchParams): Promise<DiscoveredBusiness[]> {
    const result = await this.discoverWithStats(params);
    return result.businesses;
  }

  async discoverWithStats(params: DiscoverySearchParams): Promise<MetaGraphDiscoverStats> {
    await platformSettings.ensureLoaded();
    if (!(await this.isConfigured())) return emptyStats();

    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    const queries = buildMetaSearchQueries(params, getMetaGraphQueryLimit(mode));
    const maxPages = getMetaGraphPagesPerQuery(mode);

    const seen = new Set<string>();
    const businesses: DiscoveredBusiness[] = [];
    let apiCalls = 0;
    let queriesRun = 0;
    let pagesFound = 0;
    let placesFound = 0;
    let capped = false;

    logger.info('Meta Graph discovery started', { queryCount: queries.length, maxPages, mode });

    for (const query of queries) {
      queriesRun++;

      try {
        const pageResult = await this.fetchPaged(
          'page',
          query,
          maxPages,
          async (q, after) => {
            if (!(await this.governor.canSpend('meta_graph', 1))) {
              capped = true;
              return null;
            }
            const response = await this.client.searchPages(q, { after, limit: 25 });
            await this.governor.recordSpend({
              provider: 'meta_graph',
              operation: 'search_page',
              units: 1,
            });
            apiCalls++;
            return response;
          },
        );

        if (pageResult === null) break;

        for (const page of pageResult) {
          pagesFound++;
          for (const mapped of mapMetaPageToDiscoveredBusiness(page, params, query)) {
            if (!mapped.externalId || seen.has(mapped.externalId)) continue;
            seen.add(mapped.externalId);
            businesses.push(mapped);
          }
        }

        const placeResult = await this.fetchPaged(
          'place',
          query,
          maxPages,
          async (q, after) => {
            if (!(await this.governor.canSpend('meta_graph', 1))) {
              capped = true;
              return null;
            }
            const response = await this.client.searchPlaces(q, { after, limit: 25 });
            await this.governor.recordSpend({
              provider: 'meta_graph',
              operation: 'search_place',
              units: 1,
            });
            apiCalls++;
            return response;
          },
        );

        if (placeResult === null) break;

        for (const place of placeResult) {
          placesFound++;
          const mapped = mapMetaPlaceToDiscoveredBusiness(place, params, query);
          if (!mapped?.externalId || seen.has(mapped.externalId)) continue;
          seen.add(mapped.externalId);
          businesses.push(mapped);
        }
      } catch (err) {
        if (err instanceof MetaGraphApiError) {
          if (err.isAuthError) {
            logger.warn('Meta Graph auth error — skipping remaining queries', {
              message: err.message,
              code: err.code,
            });
            break;
          }
          if (err.isRateLimit) {
            logger.warn('Meta Graph rate limit — skipping remaining queries', {
              message: err.message,
              code: err.code,
            });
            capped = true;
            break;
          }
        }
        logger.warn('Meta Graph query failed', { query, error: String(err) });
      }
    }

    logger.info('Meta Graph discovery complete', {
      count: businesses.length,
      apiCalls,
      queriesRun,
      pagesFound,
      placesFound,
      capped,
    });

    return { businesses, queriesRun, apiCalls, pagesFound, placesFound, capped };
  }

  private async fetchPaged<T extends { id: string }>(
    _kind: 'page' | 'place',
    query: string,
    maxPages: number,
    fetchPage: (
      query: string,
      after?: string,
    ) => Promise<{ data?: T[]; paging?: { cursors?: { after?: string } } } | null>,
  ): Promise<T[] | null> {
    const items: T[] = [];
    let after: string | undefined;

    for (let page = 0; page < maxPages; page++) {
      const response = await fetchPage(query, after);
      if (response === null) return items.length > 0 ? items : null;

      const batch = response.data ?? [];
      items.push(...batch);

      const nextAfter = response.paging?.cursors?.after;
      if (!nextAfter || batch.length === 0) break;
      after = nextAfter;
    }

    return items;
  }
}

function emptyStats(): MetaGraphDiscoverStats {
  return {
    businesses: [],
    queriesRun: 0,
    apiCalls: 0,
    pagesFound: 0,
    placesFound: 0,
    capped: false,
  };
}
