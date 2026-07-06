import { platformSettings } from '@agency/settings';
import { buildSocialSearchQueries } from '../../lib/build-social-search-queries';
import { getSearchPagesPerQuery, getSocialSearchQueryLimit } from '../../lib/run-profile';
import { SearchApiClient, type SearchApiCallError } from '../search-api-client';
import {
  runParallelSearchDiscover,
  type SearchDiscoverStats,
} from '../search-discover-engine';
import type { DiscoveredBusiness, DiscoveryProvider, DiscoverySearchParams } from '../types';
import { parseSocialSearchResultItem } from './parse-social-search-result';

export type SocialSearchDiscoverStats = SearchDiscoverStats & {
  /** @deprecated use dropped */
  droppedNonSocial: number;
  /** @deprecated use queriesPlanned */
  queriesRun: number;
};

function toSocialStats(stats: SearchDiscoverStats): SocialSearchDiscoverStats {
  return {
    ...stats,
    droppedNonSocial: stats.dropped,
    queriesRun: stats.queriesExecuted,
  };
}

export class SocialSearchProvider implements DiscoveryProvider {
  readonly name = 'social_search' as const;
  readonly label = 'Social search (TikTok / LinkedIn / X / YouTube)';

  private client = new SearchApiClient({
    logContext: 'social_search',
    cseOperation: 'social_search',
    bingOperation: 'social_search',
  });

  async isConfigured(): Promise<boolean> {
    await platformSettings.ensureLoaded();
    return this.client.isConfigured();
  }

  async discover(params: DiscoverySearchParams): Promise<DiscoveredBusiness[]> {
    const result = await this.discoverWithStats(params);
    return result.businesses;
  }

  async discoverWithStats(params: DiscoverySearchParams): Promise<SocialSearchDiscoverStats> {
    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    const queries = buildSocialSearchQueries(params, getSocialSearchQueryLimit(mode));
    const maxPages = getSearchPagesPerQuery(mode);

    const stats = await runParallelSearchDiscover({
      params,
      queries,
      maxPages,
      logContext: 'social_search',
      client: this.client,
      parseItem: (item, query, p) => parseSocialSearchResultItem(item, p, query),
    });

    return toSocialStats(stats);
  }
}

export type { SearchApiCallError };
