import { platformSettings } from '@agency/settings';
import { buildPublicSearchQueries } from '../lib/build-public-search-queries';
import { getRunSearchQueryLimit, getSearchPagesPerQuery } from '../lib/run-profile';
import { parseSearchResultItem } from './parse-search-results';
import { SearchApiClient, type SearchApiCallError } from './search-api-client';
import {
  runParallelSearchDiscover,
  type SearchDiscoverStats,
} from './search-discover-engine';
import type { DiscoveredBusiness, DiscoveryProvider, DiscoverySearchParams } from './types';

export type PublicSearchDiscoverStats = SearchDiscoverStats & {
  /** @deprecated use dropped */
  droppedNonBusiness: number;
  /** @deprecated use queriesPlanned */
  queriesRun: number;
};

function toPublicStats(stats: SearchDiscoverStats): PublicSearchDiscoverStats {
  return {
    ...stats,
    droppedNonBusiness: stats.dropped,
    queriesRun: stats.queriesExecuted,
  };
}

export class PublicSearchProvider implements DiscoveryProvider {
  readonly name = 'public_search' as const;
  readonly label = 'Public Search (Google CSE / Bing)';

  private client = new SearchApiClient({ logContext: 'public_search' });

  async isConfigured(): Promise<boolean> {
    await platformSettings.ensureLoaded();
    return this.client.isConfigured();
  }

  async discover(params: DiscoverySearchParams): Promise<DiscoveredBusiness[]> {
    const result = await this.discoverWithStats(params);
    return result.businesses;
  }

  async discoverWithStats(params: DiscoverySearchParams): Promise<PublicSearchDiscoverStats> {
    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    const queries = buildPublicSearchQueries(params, getRunSearchQueryLimit(mode));
    const maxPages = getSearchPagesPerQuery(mode);

    const stats = await runParallelSearchDiscover({
      params,
      queries,
      maxPages,
      logContext: 'public_search',
      client: this.client,
      parseItem: (item, query, p) => parseSearchResultItem(item, p, query),
    });

    return toPublicStats(stats);
  }
}

export type { SearchApiCallError };
