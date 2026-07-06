import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIDigitalGap, BoIProjectValueBand, BoIProjectValueEstimate } from './types';

const BAND_RANGES: Record<BoIProjectValueBand, { minUgx: number; maxUgx: number }> = {
  starter: { minUgx: 1_500_000, maxUgx: 4_000_000 },
  growth: { minUgx: 4_000_000, maxUgx: 12_000_000 },
  premium: { minUgx: 12_000_000, maxUgx: 30_000_000 },
};

const TIER1_CITIES = new Set(
  ['kampala', 'nairobi', 'kigali', 'dar es salaam', 'lagos', 'accra', 'johannesburg'].map((c) =>
    c.toLowerCase(),
  ),
);

const TIER2_CITIES = new Set(
  ['entebbe', 'jinja', 'mbarara', 'gulu', 'mombasa', 'kisumu'].map((c) => c.toLowerCase()),
);

type IndustryBase = { band: BoIProjectValueBand; label: string };

function industryBase(industry?: string | null): IndustryBase {
  const key = (industry ?? '').trim().toLowerCase();
  if (!key) return { band: 'growth', label: 'General SMB web project' };

  if (/(salon|spa|fitness|gym|dental|veterinary|restaurant|hospitality)/i.test(key)) {
    return { band: 'starter', label: 'Local service business website' };
  }
  if (/(e-?commerce|retail|automotive|real estate|construction)/i.test(key)) {
    return { band: 'growth', label: 'Commerce / lead-gen website' };
  }
  if (/(healthcare|legal|accounting|technology|marketing agency|web development)/i.test(key)) {
    return { band: 'premium', label: 'Professional / high-trust digital presence' };
  }
  return { band: 'growth', label: 'Standard SMB website project' };
}

function cityTier(city?: string | null): { tier: 1 | 2 | 3; label: string } {
  const normalized = (city ?? '').trim().toLowerCase();
  if (!normalized) return { tier: 3, label: 'Regional market' };
  if (TIER1_CITIES.has(normalized)) return { tier: 1, label: `${city} — primary market` };
  if (TIER2_CITIES.has(normalized)) return { tier: 2, label: `${city} — secondary city` };
  return { tier: 3, label: `${city} — regional market` };
}

function bumpBand(band: BoIProjectValueBand, steps: number): BoIProjectValueBand {
  const order: BoIProjectValueBand[] = ['starter', 'growth', 'premium'];
  const idx = Math.min(order.length - 1, Math.max(0, order.indexOf(band) + steps));
  return order[idx]!;
}

function gapPressure(digitalGaps: BoIDigitalGap[]): { steps: number; labels: string[] } {
  const high = digitalGaps.filter((g) => g.severity === 'high').length;
  const medium = digitalGaps.filter((g) => g.severity === 'medium').length;
  const labels: string[] = [];
  let steps = 0;

  if (high >= 2) {
    steps += 1;
    labels.push(`${high} high-severity digital gaps`);
  } else if (high === 1) {
    labels.push('1 high-severity digital gap');
  }

  if (medium >= 3) {
    steps += 1;
    labels.push(`${medium} medium-severity gaps`);
  }

  if (digitalGaps.some((g) => g.id === 'no_website' || g.id === 'social_only')) {
    steps += 1;
    labels.push('Greenfield or social-only presence');
  }

  return { steps, labels };
}

/**
 * Rules-based UGX project value band from industry, city tier, and digital gap pressure.
 * Always tagged as an estimate — not a quote.
 */
export function estimateProjectValue(
  profile: BusinessIntelligenceProfile,
  digitalGaps: BoIDigitalGap[],
): BoIProjectValueEstimate | null {
  if (digitalGaps.length === 0 && !profile.presence.hasWebsite) {
    return null;
  }

  const base = industryBase(profile.identity.industry);
  const market = cityTier(profile.identity.city);
  const gaps = gapPressure(digitalGaps);

  let band = base.band;
  if (market.tier === 1) band = bumpBand(band, 1);
  else if (market.tier === 3 && band === 'premium') band = bumpBand(band, -1);

  band = bumpBand(band, gaps.steps);

  const range = BAND_RANGES[band];
  const factors = [base.label, market.label, ...gaps.labels].filter(Boolean);

  if (factors.length === 0) return null;

  return {
    currency: 'UGX',
    band,
    minUgx: range.minUgx,
    maxUgx: range.maxUgx,
    disclaimer: 'estimate',
    factors,
  };
}

export function formatUgxRange(minUgx: number, maxUgx: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(
      n,
    );
  return `${fmt(minUgx)} – ${fmt(maxUgx)}`;
}
