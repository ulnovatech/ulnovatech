import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIDigitalGap, BoIPurchaseReadiness, BoIReadinessBand, BoIStructuredPain } from './types';

type ReadinessFactor = { key: string; label: string; weight: number };

const SEVERITY_WEIGHT: Record<string, number> = {
  high: 12,
  medium: 8,
  low: 4,
};

function scoreToBand(score: number | null): BoIReadinessBand {
  if (score == null) return 'unknown';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Rules-based purchase readiness from real profile proxies.
 * Omits factor contributions when underlying data is absent.
 */
export function computePurchaseReadiness(
  profile: BusinessIntelligenceProfile,
  digitalGaps: BoIDigitalGap[],
  pains: BoIStructuredPain[],
): BoIPurchaseReadiness {
  const factors: ReadinessFactor[] = [];
  let totalWeight = 0;
  let weightedSum = 0;

  const reviewCount = profile.presence.reviewCount;
  if (typeof reviewCount === 'number' && reviewCount > 0) {
    const weight = 25;
    const contribution =
      reviewCount >= 20 ? 1 : reviewCount >= 10 ? 0.85 : reviewCount >= 5 ? 0.65 : 0.45;
    factors.push({
      key: 'review_volume',
      label: `${reviewCount} Google review(s) — established local demand`,
      weight,
    });
    totalWeight += weight;
    weightedSum += contribution * weight;
  }

  const socialCount = profile.digitalFootprint.socialLinks.length;
  if (socialCount > 0) {
    const weight = 20;
    const contribution = socialCount >= 3 ? 1 : socialCount >= 2 ? 0.8 : 0.55;
    factors.push({
      key: 'social_footprint',
      label: `${socialCount} social profile(s) — active digital footprint`,
      weight,
    });
    totalWeight += weight;
    weightedSum += contribution * weight;
  }

  const hasEmail = !!profile.contact.email?.trim();
  const hasPhone = !!profile.contact.phone?.trim();
  if (hasEmail || hasPhone) {
    const weight = 20;
    const contribution = hasEmail && hasPhone ? 1 : 0.7;
    factors.push({
      key: 'reachability',
      label: hasEmail && hasPhone ? 'Email and phone on file' : 'Contact path available for outreach',
      weight,
    });
    totalWeight += weight;
    weightedSum += contribution * weight;
  }

  const highGaps = digitalGaps.filter((g) => g.severity === 'high').length;
  const medGaps = digitalGaps.filter((g) => g.severity === 'medium').length;
  if (digitalGaps.length > 0) {
    const weight = 15;
    const gapScore = Math.min(
      1,
      (highGaps * (SEVERITY_WEIGHT.high ?? 12) + medGaps * (SEVERITY_WEIGHT.medium ?? 8)) / 30,
    );
    factors.push({
      key: 'gap_severity',
      label: `${digitalGaps.length} digital gap(s) — clear improvement opportunity`,
      weight,
    });
    totalWeight += weight;
    weightedSum += gapScore * weight;
  }

  if (pains.length > 0) {
    const weight = 15;
    const topConfidence = pains[0]?.confidence ?? 0;
    const contribution = Math.min(1, topConfidence / 85);
    factors.push({
      key: 'pain_signals',
      label: `${pains.length} evidence-backed pain signal(s)`,
      weight,
    });
    totalWeight += weight;
    weightedSum += contribution * weight;
  }

  if (profile.presence.googleMapsUrl) {
    const weight = 10;
    factors.push({
      key: 'maps_listing',
      label: 'Verified Google Maps listing',
      weight,
    });
    totalWeight += weight;
    weightedSum += 0.75 * weight;
  }

  const computedAt = new Date().toISOString();
  if (totalWeight === 0) {
    return { score: null, band: 'unknown', factors: [], computedAt };
  }

  const score = clampScore((weightedSum / totalWeight) * 100);
  return {
    score,
    band: scoreToBand(score),
    factors,
    computedAt,
  };
}
