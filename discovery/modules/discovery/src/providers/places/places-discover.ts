import { countryToIso2 } from '@agency/geo';
import {
  discoveryTargetCandidates,
  logger,
  mapWithConcurrency,
  placesQueryConcurrency,
} from '@agency/config';
import { platformSettings } from '@agency/settings';
import { buildCitySearchQueries } from '../../lib/build-search-query';
import { googleMapsEnabledInMode } from '../../lib/run-profile';
import type { DiscoveredBusiness, DiscoveryProvider, DiscoverySearchParams } from '../types';
import { placeSearchResultToDiscoveredBusiness, placesIdFromExternalId } from './place-to-candidate';
import { PlacesApiClient } from './places-client';
import type { PlacesTextSearchResponse } from './places-types';

export type PlacesDiscoverResult = {
  businesses: DiscoveredBusiness[];
  textSearchCalls: number;
  queriesRun: number;
  capped: boolean;
};

export class GooglePlacesDiscoveryProvider implements DiscoveryProvider {
  readonly name = 'google_maps' as const;
  readonly label = 'Google Maps / Business listings (primary)';

  private client = new PlacesApiClient();

  async isConfigured(): Promise<boolean> {
    return this.client.isConfigured();
  }

  async discover(params: DiscoverySearchParams): Promise<DiscoveredBusiness[]> {
    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    if (!googleMapsEnabledInMode(mode)) {
      logger.info('Places discovery skipped — economy/micro mode');
      return [];
    }

    if (!(await this.isConfigured())) {
      return [];
    }

    const result = await this.discoverWithStats(params);
    return result.businesses;
  }

  async discoverWithStats(params: DiscoverySearchParams): Promise<PlacesDiscoverResult> {
    await platformSettings.ensureLoaded();
    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    const maxCalls = platformSettings.getPlacesDiscoverMaxPerRun(mode);
    const pageSize = platformSettings.getPlacesDiscoverPageSize();
    const regionCode = countryToIso2(params.country);
    const queries = buildCitySearchQueries(params);
    const target = discoveryTargetCandidates();
    const maxPagesPerQuery = mode === 'boost' ? 3 : 1;
    const concurrency = placesQueryConcurrency();

    const seenPlaces = new Set<string>();
    const businesses: DiscoveredBusiness[] = [];
    const budget = { calls: 0, capped: false };

    logger.info('Places primary discovery started', {
      queryCount: queries.length,
      maxCalls,
      pageSize,
      mode,
      target,
      concurrency,
      maxPagesPerQuery,
    });

    const ingestPlaces = (places: PlacesTextSearchResponse['places']) => {
      for (const place of places ?? []) {
        if (businesses.length >= target) return;
        const mapped = placeSearchResultToDiscoveredBusiness(place, params);
        if (!mapped) continue;
        const pid =
          placesIdFromExternalId(mapped.externalId) ??
          (mapped.metadata?.placesId as string | undefined);
        if (!pid || seenPlaces.has(pid)) continue;
        seenPlaces.add(pid);
        businesses.push(mapped);
      }
    };

    const runQuery = async (textQuery: string) => {
      if (budget.calls >= maxCalls || businesses.length >= target) return;

      let pageToken: string | undefined;
      let pages = 0;

      do {
        if (budget.calls >= maxCalls || businesses.length >= target) {
          budget.capped = true;
          break;
        }

        const data = await this.client.textSearch(textQuery, regionCode, undefined, {
          pageSize,
          pageToken,
        });
        budget.calls++;
        pages++;

        if (!data?.places?.length) break;
        ingestPlaces(data.places);

        pageToken = data.nextPageToken;
      } while (pageToken && pages < maxPagesPerQuery);
    };

    await mapWithConcurrency(queries, concurrency, (textQuery) => runQuery(textQuery));

    if (budget.calls >= maxCalls) budget.capped = true;
    if (businesses.length >= target) budget.capped = true;

    logger.info('Places primary discovery complete', {
      count: businesses.length,
      textSearchCalls: budget.calls,
      queriesRun: queries.length,
      capped: budget.capped,
    });

    return {
      businesses,
      textSearchCalls: budget.calls,
      queriesRun: queries.length,
      capped: budget.capped,
    };
  }
}
