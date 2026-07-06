import { prospectVerifyBoost } from '../providers/places/needs-verify';
import type { DiscoveredBusiness } from '../providers/types';

/** Candidates with at least one prospect heuristic signal (social-only, pain keywords, directory listing). */
export function countProspectCandidates(candidates: DiscoveredBusiness[]): number {
  return candidates.filter((c) => prospectVerifyBoost(c) > 0).length;
}

/** Stronger subset — social-only or multiple prospect signals (boost ≥ 4). */
export function countHighPotentialEstimate(candidates: DiscoveredBusiness[]): number {
  return candidates.filter((c) => prospectVerifyBoost(c) >= 4).length;
}

export function businessRowToProspectShape(row: {
  name: string;
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  sourceUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}): DiscoveredBusiness {
  return {
    name: row.name,
    website: row.website ?? undefined,
    facebookUrl: row.facebookUrl ?? undefined,
    instagramUrl: row.instagramUrl ?? undefined,
    sourceUrl: row.sourceUrl ?? undefined,
    source: 'public_search',
    metadata: row.metadata ?? undefined,
  };
}
