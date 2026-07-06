import { countryToIso2 } from '@agency/geo';
import { logger, mapWithConcurrency, pipelineConcurrency } from '@agency/config';
import { platformSettings } from '@agency/settings';
import { shouldSpendPlacesLookup } from '../../places-refresh';
import type { DiscoveredBusiness, DiscoverySearchParams } from '../types';
import { PlacesApiClient } from './places-client';
import {
  buildVerifyTextQuery,
  isSocialOnlyCandidate,
  needsPlacesVerify,
  prospectVerifyBoost,
  verifyPriority,
} from './needs-verify';
import type { PlacesTextSearchResult } from './places-types';

function parseCityFromComponents(
  components?: Array<{ longText?: string; types?: string[] }>,
): string | undefined {
  if (!components) return undefined;
  const locality = components.find(
    (c) => c.types?.includes('locality') || c.types?.includes('postal_town'),
  );
  return locality?.longText;
}

function mergePlaceIntoCandidate(
  candidate: DiscoveredBusiness,
  place: PlacesTextSearchResult,
): DiscoveredBusiness {
  const placesId = place.id;
  return {
    ...candidate,
    phone: candidate.phone || place.nationalPhoneNumber || undefined,
    website: candidate.website || place.websiteUri || undefined,
    city: candidate.city || parseCityFromComponents(place.addressComponents),
    googleMapsUrl: candidate.googleMapsUrl || place.googleMapsUri,
    rating: candidate.rating ?? place.rating,
    reviewCount: candidate.reviewCount ?? place.userRatingCount,
    metadata: {
      ...candidate.metadata,
      formattedAddress: place.formattedAddress,
      businessStatus: place.businessStatus,
      placesId,
      placesVerified: true,
    },
  };
}

function candidateKey(candidate: DiscoveredBusiness): string {
  return candidate.externalId ?? `${candidate.name}|${candidate.city}|${candidate.country}|${candidate.source}`;
}

type VerifyWorkerOutcome = {
  key: string;
  merged?: DiscoveredBusiness;
  textSearchCalls: number;
  enriched: number;
  skippedCache: number;
};

export interface VerifyResult {
  candidates: DiscoveredBusiness[];
  textSearchCalls: number;
  enriched: number;
  skippedCache: number;
  capped: number;
  concurrency: number;
  prospectPrioritized: number;
}

export class GooglePlacesVerifyProvider {
  readonly name = 'google_maps' as const;
  readonly label = 'Google Places (verify/enrich)';

  private client = new PlacesApiClient();

  async isConfigured(): Promise<boolean> {
    return this.client.isConfigured();
  }

  async verifyCandidates(
    candidates: DiscoveredBusiness[],
    params: DiscoverySearchParams,
    runId: string,
  ): Promise<VerifyResult> {
    await platformSettings.ensureLoaded();
    const mode = params.acquisitionMode ?? platformSettings.getAcquisitionMode();
    if (mode === 'economy') {
      return emptyVerifyResult(candidates);
    }

    if (!(await this.isConfigured())) {
      return emptyVerifyResult(candidates);
    }

    const maxCalls = platformSettings.getPlacesVerifyMaxPerRun(mode);
    const allCitiesLabel = platformSettings.getSync().discovery.allCitiesLabel;
    const regionCode = countryToIso2(params.country);
    const concurrency = pipelineConcurrency();

    const needing = candidates
      .filter(needsPlacesVerify)
      .sort((a, b) => verifyPriority(b) - verifyPriority(a));

    const cappedCount = Math.max(0, needing.length - maxCalls);
    const toProcess = needing.slice(0, maxCalls);
    const prospectPrioritized = toProcess.filter((c) => prospectVerifyBoost(c) > 0).length;

    const byKey = new Map<string, DiscoveredBusiness>();
    for (const c of candidates) {
      byKey.set(candidateKey(c), c);
    }

    const verifyOne = async (candidate: DiscoveredBusiness): Promise<VerifyWorkerOutcome> => {
      const key = candidateKey(candidate);
      const empty: VerifyWorkerOutcome = {
        key,
        textSearchCalls: 0,
        enriched: 0,
        skippedCache: 0,
      };

      const existingPlacesId = (candidate.metadata?.placesId as string | undefined)?.trim();
      if (existingPlacesId && !(await shouldSpendPlacesLookup(existingPlacesId))) {
        return { ...empty, skippedCache: 1 };
      }

      const textQuery = buildVerifyTextQuery(candidate, params, allCitiesLabel);
      const data = await this.client.textSearch(textQuery, regionCode, runId);

      const place = data?.places?.[0];
      if (!place?.id) {
        logger.info('Places verify returned no match', { textQuery, name: candidate.name });
        return { ...empty, textSearchCalls: 1 };
      }

      if (!(await shouldSpendPlacesLookup(place.id))) {
        return { ...empty, textSearchCalls: 1, skippedCache: 1 };
      }

      return {
        key,
        merged: mergePlaceIntoCandidate(candidate, place),
        textSearchCalls: 1,
        enriched: 1,
        skippedCache: 0,
      };
    };

    logger.info('Places verify started', {
      runId,
      needing: needing.length,
      toProcess: toProcess.length,
      maxCalls,
      concurrency,
      prospectPrioritized,
    });

    const outcomes = await mapWithConcurrency(toProcess, concurrency, verifyOne);

    let textSearchCalls = 0;
    let enriched = 0;
    let skippedCache = 0;

    for (const outcome of outcomes) {
      textSearchCalls += outcome.textSearchCalls;
      enriched += outcome.enriched;
      skippedCache += outcome.skippedCache;
      if (outcome.merged) {
        byKey.set(outcome.key, outcome.merged);
      }
    }

    logger.info('Places verify complete', {
      runId,
      textSearchCalls,
      enriched,
      skippedCache,
      capped: cappedCount,
      maxCalls,
      concurrency,
      prospectPrioritized,
      socialOnlyInBatch: toProcess.filter(isSocialOnlyCandidate).length,
    });

    return {
      candidates: [...byKey.values()],
      textSearchCalls,
      enriched,
      skippedCache,
      capped: cappedCount,
      concurrency,
      prospectPrioritized,
    };
  }
}

function emptyVerifyResult(candidates: DiscoveredBusiness[]): VerifyResult {
  return {
    candidates,
    textSearchCalls: 0,
    enriched: 0,
    skippedCache: 0,
    capped: 0,
    concurrency: 0,
    prospectPrioritized: 0,
  };
}
