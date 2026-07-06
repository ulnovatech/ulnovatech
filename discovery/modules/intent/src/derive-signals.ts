import {
  DiscoveryRepository,
  buildBusinessSignalsFromReviews,
  readPlacesReviewsFromMetadata,
  reviewPainSourceUrl,
} from '@agency/discovery';
import { mapWithConcurrency, pipelineConcurrency } from '@agency/config';
import { BiProfileService, IntelligenceService, type BusinessIntelligenceProfile } from '@agency/intelligence';
import { BI_OPPORTUNITY_FLAG_LABELS, hasRealWebsite } from '@agency/scoring';
import { IntentRepository } from './repository';

const BI_SIGNAL_STRENGTH: Record<string, number> = {
  missing_analytics: 45,
  missing_email_capture: 50,
  missing_online_booking: 55,
  missing_ecommerce: 40,
  no_website: 70,
  crawl_blocked: 35,
  website_unreachable: 40,
};

export class IntentDerivationService {
  private discoveryRepo = new DiscoveryRepository();
  private intelligence = new IntelligenceService();
  private biProfiles = new BiProfileService();
  private intentRepo = new IntentRepository();

  /**
   * Derives intent signals from discovery data + BI profile (post bi_enrich).
   */
  async deriveForRun(discoveryRunId: string) {
    const businesses = await this.discoveryRepo.listBusinessesByRun(discoveryRunId);
    const concurrency = pipelineConcurrency();
    const batches = await mapWithConcurrency(businesses, concurrency, (b) =>
      this.deriveForBusiness(b, discoveryRunId),
    );
    return batches.flat();
  }

  private async deriveForBusiness(
    b: Awaited<ReturnType<DiscoveryRepository['listBusinessesByRun']>>[number],
    discoveryRunId: string,
  ) {
    const created = [];
    const analysis = await this.intelligence.getAnalysis(b.id);
    const biRow = await this.biProfiles.getByBusinessId(b.id);
    const profile = (biRow?.profile ?? null) as BusinessIntelligenceProfile | null;
    const meta = (b.metadata as Record<string, unknown>) ?? {};

    const hasWebsite = profile
      ? hasRealWebsite({
          hasWebsite: profile.presence.hasWebsite,
          website: profile.contact.website,
          resolvedWebsiteFromBio: profile.digitalFootprint.linkInBioPages.find((p) => p.resolvedWebsite)
            ?.resolvedWebsite,
        })
      : (analysis?.hasWebsite ?? !!b.website);

    if (!hasWebsite) {
      const signal = await this.intentRepo.create({
        businessId: b.id,
        discoveryRunId,
        source: profile ? 'bi_profile' : b.source,
        signalType: 'pain_signal',
        signalClass: 'enrichment',
        signalStrength: profile ? 78 : 75,
        title: profile?.digitalFootprint.socialLinks.length
          ? 'Social presence without owned website'
          : 'No website listed',
        snippet: profile?.digitalFootprint.socialLinks.length
          ? `Found ${profile.digitalFootprint.socialLinks.length} social profile(s) but no owned website — web development opportunity.`
          : 'Business has no website — strong web development opportunity.',
        sourceUrl: b.googleMapsUrl ?? b.sourceUrl ?? profile?.presence.googleMapsUrl ?? undefined,
      });
      created.push(signal);
    }

    if (profile) {
      created.push(...(await this.deriveBiProfileSignals(profile, b.id, discoveryRunId)));
    }

    if (b.rating != null && b.rating < 4 && (b.reviewCount ?? 0) > 5) {
      const signal = await this.intentRepo.create({
        businessId: b.id,
        discoveryRunId,
        source: 'google_maps',
        signalType: 'pain_signal',
        signalClass: 'enrichment',
        signalStrength: 60,
        title: 'Below-average Google rating',
        snippet: `Rating ${b.rating} from ${b.reviewCount} reviews — may indicate poor digital experience.`,
        sourceUrl: b.googleMapsUrl ?? undefined,
      });
      created.push(signal);
    }

    if (analysis && !analysis.hasWebsite && hasWebsite) {
      // Crawl disagrees with listing — keep legacy path when no BI override
    } else if (analysis && !analysis.hasWebsite && !profile) {
      const signal = await this.intentRepo.create({
        businessId: b.id,
        discoveryRunId,
        source: 'intelligence',
        signalType: 'pain_signal',
        signalClass: 'enrichment',
        signalStrength: 70,
        title: 'Website missing or unreachable',
        snippet: analysis.notes ?? 'Website check failed or no site found.',
      });
      created.push(signal);
    }

    if (analysis?.httpsEnabled === false && hasWebsite) {
      const signal = await this.intentRepo.create({
        businessId: b.id,
        discoveryRunId,
        source: 'intelligence',
        signalType: 'pain_signal',
        signalClass: 'enrichment',
        signalStrength: 55,
        title: 'No HTTPS',
        snippet: 'Site not served securely — trust and SEO impact.',
        sourceUrl: b.website ?? profile?.contact.website ?? undefined,
      });
      created.push(signal);
    }

    if (analysis?.mobileFriendly === false && hasWebsite) {
      const signal = await this.intentRepo.create({
        businessId: b.id,
        discoveryRunId,
        source: 'intelligence',
        signalType: 'pain_signal',
        signalClass: 'enrichment',
        signalStrength: 50,
        title: 'Not mobile-friendly',
        snippet: 'Missing mobile viewport — poor mobile experience.',
        sourceUrl: b.website ?? profile?.contact.website ?? undefined,
      });
      created.push(signal);
    }

    if (meta.businessStatus === 'CLOSED_TEMPORARILY') {
      const signal = await this.intentRepo.create({
        businessId: b.id,
        discoveryRunId,
        source: 'google_maps',
        signalType: 'other',
        signalClass: 'enrichment',
        signalStrength: 20,
        title: 'Temporarily closed',
        snippet: 'Listing shows temporarily closed on Google Maps.',
        sourceUrl: b.googleMapsUrl ?? undefined,
      });
      created.push(signal);
    }

    return created;
  }

  private async deriveBiProfileSignals(
    profile: BusinessIntelligenceProfile,
    businessId: string,
    discoveryRunId: string,
  ) {
    const created = [];
    const seen = new Set<string>();

    for (const flag of profile.infrastructure.opportunityFlags) {
      if (flag === 'no_website') continue;
      if (seen.has(flag)) continue;
      seen.add(flag);
      const signal = await this.intentRepo.create({
        businessId,
        discoveryRunId,
        source: 'bi_profile',
        signalType: 'infrastructure_gap',
        signalClass: 'enrichment',
        signalStrength: BI_SIGNAL_STRENGTH[flag] ?? 42,
        title: BI_OPPORTUNITY_FLAG_LABELS[flag] ?? `Infrastructure gap: ${flag}`,
        snippet: `Detected via BI profile crawl audit (${flag}).`,
        sourceUrl: profile.contact.website ?? undefined,
      });
      created.push(signal);
    }

    const socialCount = profile.digitalFootprint.socialLinks.length;
    const realSite = hasRealWebsite({
      hasWebsite: profile.presence.hasWebsite,
      website: profile.contact.website,
      resolvedWebsiteFromBio: profile.digitalFootprint.linkInBioPages.find((p) => p.resolvedWebsite)
        ?.resolvedWebsite,
    });

    if (!realSite && profile.digitalFootprint.linkInBioPages.length > 0) {
      const signal = await this.intentRepo.create({
        businessId,
        discoveryRunId,
        source: 'bi_profile',
        signalType: 'footprint_gap',
        signalClass: 'enrichment',
        signalStrength: 62,
        title: 'Link-in-bio only web presence',
        snippet: 'BI profile resolved link-in-bio page(s) but no owned website.',
        sourceUrl: profile.digitalFootprint.linkInBioPages[0]?.url,
      });
      created.push(signal);
    }

    if (!realSite && socialCount >= 2) {
      const signal = await this.intentRepo.create({
        businessId,
        discoveryRunId,
        source: 'bi_profile',
        signalType: 'footprint_gap',
        signalClass: 'enrichment',
        signalStrength: 58,
        title: 'Multi-platform social footprint',
        snippet: `${socialCount} social profiles found — opportunity to unify presence on a real site.`,
      });
      created.push(signal);
    }

    return created;
  }

  /**
   * Post-places_enrich: emit enrichment signals from mined Google review pain keywords.
   */
  async deriveReviewPainSignalsForRun(discoveryRunId: string) {
    const businesses = await this.discoveryRepo.listBusinessesByRun(discoveryRunId);
    const created = [];
    let skipped = 0;

    for (const b of businesses) {
      const meta = (b.metadata as Record<string, unknown>) ?? {};
      const storedPain = meta.reviewPainKeywords;
      const painKeywords = Array.isArray(storedPain) && storedPain.length > 0
        ? (storedPain as Array<{
            keyword: string;
            label: string;
            excerpt: string;
            reviewRating?: number | null;
            signalStrength: number;
          }>)
        : buildBusinessSignalsFromReviews(readPlacesReviewsFromMetadata(meta)).painKeywords;

      if (painKeywords.length === 0) {
        skipped++;
        continue;
      }

      const seenKeywords = new Set<string>();
      for (const match of painKeywords) {
        if (seenKeywords.has(match.keyword)) continue;
        seenKeywords.add(match.keyword);

        const sourceUrl = reviewPainSourceUrl(b.id, match.keyword);
        const existing = await this.intentRepo.findBySourceUrl(sourceUrl);
        if (existing) continue;

        const signal = await this.intentRepo.create({
          businessId: b.id,
          discoveryRunId,
          source: 'google_places',
          signalType: 'review_pain',
          signalClass: 'enrichment',
          signalStrength: match.signalStrength,
          title: match.label,
          snippet: match.excerpt,
          sourceUrl,
        });
        created.push(signal);
      }
    }

    return { created, skipped };
  }
}
