import type { DiscoveredBusiness } from '../types';

const PAIN_KEYWORDS = [
  'no website',
  'without website',
  'no web site',
  'facebook only',
  'instagram only',
  'no online',
  'call only',
  'dm to book',
  'book via',
  'message to order',
];

const LISTICLE_TITLE = /\b(top\s*\d+|best\s+\d+|list of)\b/i;

export function needsPlacesVerify(candidate: DiscoveredBusiness): boolean {
  if (candidate.source === 'google_maps') return false;

  const missingPhone = !candidate.phone?.trim();
  const missingRating = candidate.rating == null;
  const missingAddress = !candidate.metadata?.formattedAddress;

  return missingPhone || missingRating || missingAddress;
}

export function isSocialOnlyCandidate(candidate: DiscoveredBusiness): boolean {
  if (candidate.website?.trim()) return false;

  const meta = candidate.metadata ?? {};
  if (meta.resultKind === 'social_profile') return true;
  if (meta.primaryPlatform) return true;

  return !!(candidate.facebookUrl?.trim() || candidate.instagramUrl?.trim());
}

export function hasProspectPainSignal(candidate: DiscoveredBusiness): boolean {
  const haystack = [
    candidate.name,
    typeof candidate.metadata?.snippet === 'string' ? candidate.metadata.snippet : '',
    candidate.sourceUrl ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return PAIN_KEYWORDS.some((kw) => haystack.includes(kw));
}

export function isDirectoryListingCandidate(candidate: DiscoveredBusiness): boolean {
  if (candidate.metadata?.resultKind !== 'directory') return false;
  const title = candidate.name?.trim() ?? '';
  if (title.length < 3) return false;
  if (LISTICLE_TITLE.test(title)) return false;
  return true;
}

/** Extra priority weight for high-potential search-sourced prospects. */
export function prospectVerifyBoost(candidate: DiscoveredBusiness): number {
  let boost = 0;
  if (isSocialOnlyCandidate(candidate)) boost += 4;
  if (hasProspectPainSignal(candidate)) boost += 3;
  if (isDirectoryListingCandidate(candidate)) boost += 2;
  return boost;
}

export function verifyPriority(candidate: DiscoveredBusiness): number {
  let score = 0;
  if (!candidate.phone?.trim()) score += 3;
  if (candidate.rating == null) score += 2;
  if (!candidate.metadata?.formattedAddress) score += 1;
  score += prospectVerifyBoost(candidate);
  return score;
}

export function buildVerifyTextQuery(
  candidate: DiscoveredBusiness,
  params: { country: string; city: string },
  allCitiesLabel: string,
): string {
  const name = candidate.name.trim();
  const city = candidate.city ?? (params.city === allCitiesLabel ? undefined : params.city);
  if (city) return `${name} ${city}, ${params.country}`;
  return `${name} ${params.country}`;
}
