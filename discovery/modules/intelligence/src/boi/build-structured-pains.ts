import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIDigitalGap, BoIStructuredPain } from './types';
import { buildDigitalGaps } from './build-digital-gaps';
import {
  BoIEvidenceRegistry,
  mapSignalSourceToEvidenceSource,
} from './evidence-registry';

export type BoIIntentSignalInput = {
  id: string;
  source: string;
  signalType: string;
  title: string;
  snippet?: string | null;
  sourceUrl?: string | null;
  signalStrength: number;
};

const REVIEW_PAIN_LABELS: Record<string, string> = {
  hard_to_book: 'Customers report booking difficulty',
  no_website: 'Customers mention missing website',
  website: 'Customers reference website experience',
  cant_find: 'Customers report difficulty finding the business',
  outdated: 'Customers describe outdated digital experience',
  online_presence: 'Customers mention weak online presence',
  contact: 'Customers report contact or reachability issues',
};

const INFRASTRUCTURE_PAIN_MAP: Record<string, { id: string; label: string; confidence: number }> = {
  missing_online_booking: {
    id: 'pain:booking_gap',
    label: 'No online booking — friction for appointment-driven customers',
    confidence: 68,
  },
  missing_email_capture: {
    id: 'pain:lead_capture_gap',
    label: 'No email capture — missed lead follow-up opportunities',
    confidence: 65,
  },
  missing_analytics: {
    id: 'pain:measurement_gap',
    label: 'No analytics — cannot measure marketing performance',
    confidence: 60,
  },
  missing_ecommerce: {
    id: 'pain:commerce_gap',
    label: 'No ecommerce — online sales path missing',
    confidence: 55,
  },
};

function upsertPain(
  pains: Map<string, BoIStructuredPain>,
  pain: BoIStructuredPain,
): void {
  const existing = pains.get(pain.id);
  if (!existing) {
    pains.set(pain.id, pain);
    return;
  }

  const evidenceIds = [...new Set([...existing.evidenceIds, ...pain.evidenceIds])];
  const sources = [...new Set([...existing.sources, ...pain.sources])];
  pains.set(pain.id, {
    ...existing,
    confidence: Math.max(existing.confidence, pain.confidence),
    evidenceIds,
    sources,
  });
}

function addReviewPains(
  profile: BusinessIntelligenceProfile,
  registry: BoIEvidenceRegistry,
  pains: Map<string, BoIStructuredPain>,
): void {
  for (const [index, match] of profile.businessSignals.painKeywords.entries()) {
    const evidenceId = `ev:review:${match.keyword}:${index}`;
    registry.add(evidenceId, {
      source: 'google_places_review',
      label: match.label,
      excerpt: match.excerpt,
      url: profile.presence.googleMapsUrl ?? null,
      capturedAt: profile.enrichedAt,
    });

    const painId = `pain:review:${match.keyword}`;
    upsertPain(pains, {
      id: painId,
      label: REVIEW_PAIN_LABELS[match.keyword] ?? match.label,
      confidence: Math.min(100, Math.max(0, match.signalStrength)),
      evidenceIds: [evidenceId],
      sources: ['google_places_review'],
    });
  }
}

function addInfrastructurePains(
  profile: BusinessIntelligenceProfile,
  registry: BoIEvidenceRegistry,
  pains: Map<string, BoIStructuredPain>,
): void {
  const crawled = profile.infrastructure.opportunityFlags.some((f) =>
    ['missing_analytics', 'missing_email_capture', 'missing_online_booking', 'missing_ecommerce'].includes(f),
  );
  if (!crawled) return;

  for (const flag of profile.infrastructure.opportunityFlags) {
    const mapped = INFRASTRUCTURE_PAIN_MAP[flag];
    if (!mapped) continue;

    const evidenceId = `ev:infra:${flag}`;
    registry.add(evidenceId, {
      source: 'website_crawl',
      label: mapped.label,
      excerpt: `Detected via website crawl audit (${flag}).`,
      url: profile.contact.website ?? null,
      capturedAt: profile.enrichedAt,
    });

    upsertPain(pains, {
      id: mapped.id,
      label: mapped.label,
      confidence: mapped.confidence,
      evidenceIds: [evidenceId],
      sources: ['website_crawl'],
    });
  }
}

function addCrawlNotePain(
  profile: BusinessIntelligenceProfile,
  registry: BoIEvidenceRegistry,
  pains: Map<string, BoIStructuredPain>,
): void {
  const notes = profile.websiteIntel.analysisNotes?.trim();
  if (!notes || notes.length < 12) return;

  const evidenceId = 'ev:crawl:analysis_notes';
  registry.add(evidenceId, {
    source: 'website_crawl',
    label: 'Website analysis notes',
    excerpt: notes.slice(0, 280),
    url: profile.contact.website ?? null,
    capturedAt: profile.websiteIntel.lastCrawledAt ?? profile.enrichedAt,
  });

  upsertPain(pains, {
    id: 'pain:website_quality',
    label: 'Website quality or reachability issues detected',
    confidence: 62,
    evidenceIds: [evidenceId],
    sources: ['website_crawl'],
  });
}

function addIntentSignalPains(
  intentSignals: BoIIntentSignalInput[],
  registry: BoIEvidenceRegistry,
  pains: Map<string, BoIStructuredPain>,
): void {
  for (const signal of intentSignals) {
    const painTypes = new Set([
      'pain_signal',
      'review_pain',
      'infrastructure_gap',
      'footprint_gap',
    ]);
    if (!painTypes.has(signal.signalType)) continue;

    const evidenceSource = mapSignalSourceToEvidenceSource(signal.source, signal.signalType);
    const evidenceId = `ev:intent:${signal.id}`;
    registry.add(evidenceId, {
      source: evidenceSource,
      label: signal.title,
      excerpt: signal.snippet ?? null,
      url: signal.sourceUrl ?? null,
    });

    const painId = `pain:intent:${signal.signalType}:${slugPainKey(signal.title)}`;
    upsertPain(pains, {
      id: painId,
      label: signal.title,
      confidence: Math.min(100, Math.max(0, signal.signalStrength)),
      evidenceIds: [evidenceId],
      sources: [evidenceSource],
    });
  }
}

function slugPainKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
}

function addNoWebsitePain(
  profile: BusinessIntelligenceProfile,
  registry: BoIEvidenceRegistry,
  pains: Map<string, BoIStructuredPain>,
): void {
  if (profile.presence.hasWebsite || profile.contact.website?.trim()) return;
  if (!profile.infrastructure.opportunityFlags.includes('no_website')) return;

  const evidenceId = 'ev:presence:no_website';
  registry.add(evidenceId, {
    source: 'bi_profile',
    label: 'No website listed',
    excerpt:
      profile.digitalFootprint.socialLinks.length > 0
        ? 'Social profiles exist but no owned website is listed.'
        : 'No owned website found in discovery or BI profile.',
    url: profile.presence.googleMapsUrl ?? null,
    capturedAt: profile.enrichedAt,
  });

  upsertPain(pains, {
    id: 'pain:no_web_presence',
    label: 'No owned website — greenfield web opportunity',
    confidence: 85,
    evidenceIds: [evidenceId],
    sources: ['bi_profile'],
  });
}

/**
 * Structured business pains from review text, crawl notes, BI flags, and optional intent signals.
 * Returns empty array when no qualifying evidence exists.
 */
export function buildStructuredPains(
  profile: BusinessIntelligenceProfile,
  registry: BoIEvidenceRegistry,
  intentSignals: BoIIntentSignalInput[] = [],
): BoIStructuredPain[] {
  const pains = new Map<string, BoIStructuredPain>();

  addNoWebsitePain(profile, registry, pains);
  addReviewPains(profile, registry, pains);
  addInfrastructurePains(profile, registry, pains);
  addCrawlNotePain(profile, registry, pains);
  addIntentSignalPains(intentSignals, registry, pains);

  return [...pains.values()].sort((a, b) => b.confidence - a.confidence);
}

export function buildBoIGapsAndPains(input: {
  profile: BusinessIntelligenceProfile;
  intentSignals?: BoIIntentSignalInput[];
}): {
  evidence: ReturnType<BoIEvidenceRegistry['all']>;
  digitalGaps: BoIDigitalGap[];
  pains: BoIStructuredPain[];
} {
  const registry = new BoIEvidenceRegistry();
  const digitalGaps = buildDigitalGaps(input.profile, registry);
  const pains = buildStructuredPains(input.profile, registry, input.intentSignals ?? []);
  return { evidence: registry.all(), digitalGaps, pains };
}
