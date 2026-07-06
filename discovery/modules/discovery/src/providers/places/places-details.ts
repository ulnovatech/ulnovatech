import { AccountRepository } from '@agency/accounts';
import { getDb, businesses, leadScores } from '@agency/database';
import { logger, mapWithConcurrency, pipelineConcurrency } from '@agency/config';
import { platformSettings } from '@agency/settings';
import { and, desc, eq, gte } from 'drizzle-orm';
import { profileToMode, type RunProfile } from '../../lib/run-profile';
import { DiscoveryRepository } from '../../repository';
import { shouldSpendPlacesLookup } from '../../places-refresh';
import { PlacesApiClient } from './places-client';
import {
  buildBusinessSignalsFromReviews,
  extractReviewSnippets,
  type PlacesReviewRecord,
} from './review-pain-signals';

export interface DetailsEnrichResult {
  attempted: number;
  enriched: number;
  skippedCache: number;
  capped: number;
  enrichedBusinessIds: string[];
}

export class GooglePlacesDetailsProvider {
  private client = new PlacesApiClient();
  private repo = new DiscoveryRepository();

  async isConfigured(): Promise<boolean> {
    return this.client.isConfigured();
  }

  async enrichTopScoredForRun(runId: string): Promise<DetailsEnrichResult> {
    await platformSettings.ensureLoaded();
    const run = await this.repo.getRun(runId);
    const mode = profileToMode((run?.runProfile as RunProfile) ?? 'standard');
    if (mode === 'economy') {
      return { attempted: 0, enriched: 0, skippedCache: 0, capped: 0, enrichedBusinessIds: [] };
    }
    if (!(await this.isConfigured())) {
      return { attempted: 0, enriched: 0, skippedCache: 0, capped: 0, enrichedBusinessIds: [] };
    }

    const { detailsTopN, detailsMinScore } = platformSettings.getPlacesRunSettings();
    const db = getDb();

    const rows = await db
      .select({
        business: businesses,
        score: leadScores.score,
      })
      .from(businesses)
      .innerJoin(leadScores, eq(leadScores.businessId, businesses.id))
      .where(
        and(eq(businesses.discoveryRunId, runId), gte(leadScores.score, detailsMinScore)),
      )
      .orderBy(desc(leadScores.score))
      .limit(detailsTopN);

    let attempted = 0;
    let enriched = 0;
    let skippedCache = 0;

    const enrichedBusinessIds: string[] = [];
    const concurrency = pipelineConcurrency();
    const outcomes = await mapWithConcurrency(rows, concurrency, async ({ business, score }) => {
      const placesId =
        (business.metadata as Record<string, unknown> | null)?.placesId?.toString() ??
        (business.externalId?.startsWith('places/') ? business.externalId : null);

      if (!placesId) return { attempted: 0, enriched: 0, skippedCache: 0 };

      if (!(await shouldSpendPlacesLookup(placesId))) {
        return { attempted: 0, enriched: 0, skippedCache: 1 };
      }

      const details = await this.client.placeDetails(placesId, runId);
      if (!details) return { attempted: 1, enriched: 0, skippedCache: 0 };

      const reviewRecords: PlacesReviewRecord[] = (details.reviews ?? [])
        .map((r) => ({
          text: r.text?.text ?? null,
          rating: r.rating ?? null,
          publishTime: r.publishTime ?? null,
        }))
        .filter((r) => r.text?.trim());

      const reviewSnippets = extractReviewSnippets(reviewRecords);
      const businessSignals = buildBusinessSignalsFromReviews(reviewRecords);

      await this.repo.updateBusiness(business.id, {
        phone: business.phone || details.nationalPhoneNumber || details.internationalPhoneNumber || null,
        website: business.website || details.websiteUri || null,
        rating: business.rating ?? details.rating ?? null,
        reviewCount: business.reviewCount ?? details.userRatingCount ?? null,
        googleMapsUrl: business.googleMapsUrl || details.googleMapsUri || null,
        metadata: {
          ...(business.metadata as Record<string, unknown> | null),
          placesId,
          placesDetailsAt: new Date().toISOString(),
          formattedAddress: details.formattedAddress,
          reviews: reviewRecords,
          reviewSnippets,
          reviewPainKeywords: businessSignals.painKeywords,
          leadScoreAtEnrich: score,
        },
      });

      if (business.accountId) {
        const accountRepo = new AccountRepository();
        const phone =
          business.phone || details.nationalPhoneNumber || details.internationalPhoneNumber || null;
        await accountRepo.update(business.accountId, {
          phone: phone ?? undefined,
          website: business.website || details.websiteUri || undefined,
          rating: business.rating ?? details.rating ?? undefined,
          reviewCount: business.reviewCount ?? details.userRatingCount ?? undefined,
          googleMapsUrl: business.googleMapsUrl || details.googleMapsUri || undefined,
          lastPlacesFetchAt: new Date(),
          metadata: {
            ...(business.metadata as Record<string, unknown> | null),
            placesId,
            placesDetailsAt: new Date().toISOString(),
          },
        });
      }

      return { attempted: 1, enriched: 1, skippedCache: 0, businessId: business.id };
    });

    for (const o of outcomes) {
      attempted += o.attempted;
      enriched += o.enriched;
      skippedCache += o.skippedCache;
      if (o.enriched > 0 && 'businessId' in o && o.businessId) {
        enrichedBusinessIds.push(o.businessId as string);
      }
    }

    logger.info('Places details enrichment complete', {
      runId,
      attempted,
      enriched,
      skippedCache,
      topN: detailsTopN,
      minScore: detailsMinScore,
    });

    return {
      attempted,
      enriched,
      skippedCache,
      capped: Math.max(0, rows.length - detailsTopN),
      enrichedBusinessIds,
    };
  }
}
