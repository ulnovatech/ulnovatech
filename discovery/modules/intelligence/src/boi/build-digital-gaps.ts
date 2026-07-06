import {
  BI_OPPORTUNITY_FLAG_LABELS,
  biScoringInputFromProfile,
  deriveBiScoringHints,
  hasRealWebsite,
} from '@agency/scoring';
import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIDigitalGap, BoIGapSeverity } from './types';
import type { BoIEvidenceRegistry } from './evidence-registry';

type GapRule = {
  id: string;
  category: string;
  label: string;
  severity: BoIGapSeverity;
  confidence: number;
  evidenceId: string;
  evidenceLabel: string;
  excerpt?: string | null;
  url?: string | null;
};

const FLAG_SEVERITY: Record<string, BoIGapSeverity> = {
  no_website: 'high',
  crawl_blocked: 'medium',
  website_unreachable: 'medium',
  missing_analytics: 'low',
  missing_email_capture: 'medium',
  missing_online_booking: 'medium',
  missing_ecommerce: 'low',
};

const FLAG_CONFIDENCE: Record<string, number> = {
  no_website: 88,
  crawl_blocked: 72,
  website_unreachable: 74,
  missing_analytics: 68,
  missing_email_capture: 70,
  missing_online_booking: 72,
  missing_ecommerce: 58,
};

function gapFromFlag(
  profile: BusinessIntelligenceProfile,
  flag: string,
  registry: BoIEvidenceRegistry,
): BoIDigitalGap | null {
  const evidenceId = `gap:flag:${flag}`;
  registry.add(evidenceId, {
    source: 'bi_profile',
    label: BI_OPPORTUNITY_FLAG_LABELS[flag] ?? flag,
    excerpt: `Infrastructure audit flag: ${flag}`,
    url: profile.contact.website ?? profile.presence.googleMapsUrl ?? null,
    capturedAt: profile.enrichedAt,
  });

  return {
    id: flag,
    category: flag === 'no_website' ? 'presence' : 'infrastructure',
    label: BI_OPPORTUNITY_FLAG_LABELS[flag] ?? flag,
    severity: FLAG_SEVERITY[flag] ?? 'medium',
    confidence: FLAG_CONFIDENCE[flag] ?? 60,
    evidenceIds: [evidenceId],
  };
}

function addPresenceGap(
  profile: BusinessIntelligenceProfile,
  rule: GapRule,
  registry: BoIEvidenceRegistry,
): BoIDigitalGap {
  registry.add(rule.evidenceId, {
    source: 'bi_profile',
    label: rule.evidenceLabel,
    excerpt: rule.excerpt ?? null,
    url: rule.url ?? profile.contact.website ?? null,
    capturedAt: profile.enrichedAt,
  });

  return {
    id: rule.id,
    category: rule.category,
    label: rule.label,
    severity: rule.severity,
    confidence: rule.confidence,
    evidenceIds: [rule.evidenceId],
  };
}

/**
 * Deterministic digital gaps from BI profile evidence only.
 */
export function buildDigitalGaps(
  profile: BusinessIntelligenceProfile,
  registry: BoIEvidenceRegistry,
): BoIDigitalGap[] {
  const gaps: BoIDigitalGap[] = [];
  const seen = new Set<string>();
  const hints = deriveBiScoringHints(biScoringInputFromProfile(profile));
  const realWebsite = hasRealWebsite({
    hasWebsite: profile.presence.hasWebsite,
    website: profile.contact.website,
    resolvedWebsiteFromBio: profile.digitalFootprint.linkInBioPages.find((p) => p.resolvedWebsite)
      ?.resolvedWebsite,
  });

  for (const flag of profile.infrastructure.opportunityFlags) {
    if (seen.has(flag)) continue;
    const gap = gapFromFlag(profile, flag, registry);
    if (!gap) continue;
    seen.add(flag);
    gaps.push(gap);
  }

  if (hints.socialOnlyPresence && !seen.has('social_only')) {
    seen.add('social_only');
    gaps.push(
      addPresenceGap(
        profile,
        {
          id: 'social_only',
          category: 'presence',
          label: 'Social-only web presence',
          severity: 'high',
          confidence: 82,
          evidenceId: 'gap:social_only',
          evidenceLabel: 'Social profiles without owned website',
          excerpt: `${profile.digitalFootprint.socialLinks.length} social profile(s) found with no owned website.`,
        },
        registry,
      ),
    );
  }

  if (hints.linktreeOnly && !seen.has('link_in_bio_only')) {
    seen.add('link_in_bio_only');
    const bioUrl =
      profile.digitalFootprint.linkInBioPages[0]?.url ?? profile.contact.website ?? null;
    gaps.push(
      addPresenceGap(
        profile,
        {
          id: 'link_in_bio_only',
          category: 'presence',
          label: 'Link-in-bio page instead of owned website',
          severity: 'high',
          confidence: 80,
          evidenceId: 'gap:link_in_bio_only',
          evidenceLabel: 'Link-in-bio web presence',
          excerpt: 'Resolved link-in-bio page but no owned business website.',
          url: bioUrl,
        },
        registry,
      ),
    );
  }

  if (realWebsite && profile.presence.httpsEnabled === false && !seen.has('no_https')) {
    seen.add('no_https');
    gaps.push(
      addPresenceGap(
        profile,
        {
          id: 'no_https',
          category: 'website',
          label: 'No HTTPS — trust and SEO gap',
          severity: 'medium',
          confidence: 76,
          evidenceId: 'gap:no_https',
          evidenceLabel: 'Website not served over HTTPS',
          excerpt: profile.websiteIntel.analysisNotes ?? 'HTTPS check failed during crawl.',
          url: profile.contact.website ?? null,
        },
        registry,
      ),
    );
  }

  if (realWebsite && profile.presence.mobileFriendly === false && !seen.has('not_mobile_friendly')) {
    seen.add('not_mobile_friendly');
    gaps.push(
      addPresenceGap(
        profile,
        {
          id: 'not_mobile_friendly',
          category: 'website',
          label: 'Not mobile-friendly — conversion risk',
          severity: 'medium',
          confidence: 74,
          evidenceId: 'gap:not_mobile_friendly',
          evidenceLabel: 'Missing mobile viewport',
          excerpt: profile.websiteIntel.analysisNotes ?? 'Mobile-friendly check failed during crawl.',
          url: profile.contact.website ?? null,
        },
        registry,
      ),
    );
  }

  const crawlStatus = profile.websiteIntel.crawlStatus;
  if (crawlStatus === 'blocked' && !seen.has('crawl_blocked')) {
    seen.add('crawl_blocked');
    gaps.push(
      addPresenceGap(
        profile,
        {
          id: 'crawl_blocked',
          category: 'website',
          label: 'Crawl blocked — site may restrict automated access',
          severity: 'medium',
          confidence: 70,
          evidenceId: 'gap:crawl_blocked',
          evidenceLabel: 'Website crawl blocked',
          excerpt: 'Automated crawl could not access the site.',
          url: profile.contact.website ?? null,
        },
        registry,
      ),
    );
  } else if (crawlStatus === 'unreachable' && !seen.has('website_unreachable')) {
    seen.add('website_unreachable');
    gaps.push(
      addPresenceGap(
        profile,
        {
          id: 'website_unreachable',
          category: 'website',
          label: 'Site unreachable during crawl',
          severity: 'medium',
          confidence: 72,
          evidenceId: 'gap:website_unreachable',
          evidenceLabel: 'Website unreachable',
          excerpt: 'Crawl could not reach the listed website URL.',
          url: profile.contact.website ?? null,
        },
        registry,
      ),
    );
  }

  return gaps;
}
