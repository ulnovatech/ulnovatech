import {
  OPPORTUNITY_TYPE_LABELS,
  applyBiScoringFactors,
  biScoringInputFromProfile,
  deriveBiScoringHints,
  deriveOpportunityBrief,
  derivePitchAngle,
  hasRealWebsite,
} from '@agency/scoring';
import type { BusinessIntelligenceProfile } from '../bi/types';
import type {
  BoIDigitalGap,
  BoIEvidence,
  BoIPurchaseReadiness,
  BoISalesBrief,
  BoISolution,
  BoIStructuredPain,
} from './types';
import type { BoIDepthEnrichment } from './build-depth-enrichment';
import { formatUgxRange } from './estimate-project-value';

function buildScoringFactors(
  profile: BusinessIntelligenceProfile,
  digitalGaps: BoIDigitalGap[],
): Record<string, number> {
  const hints = deriveBiScoringHints(biScoringInputFromProfile(profile));
  let factors: Record<string, number> = {};

  const realWebsite = hasRealWebsite({
    hasWebsite: profile.presence.hasWebsite,
    website: profile.contact.website,
    resolvedWebsiteFromBio: profile.digitalFootprint.linkInBioPages.find((p) => p.resolvedWebsite)
      ?.resolvedWebsite,
  });

  if (!realWebsite) factors.noWebsite = 12;
  if (profile.presence.httpsEnabled === false && realWebsite) factors.noHttps = 6;
  if (profile.presence.mobileFriendly === false && realWebsite) factors.notMobileFriendly = 6;
  if (profile.contact.email?.trim()) factors.hasEmail = 4;
  if (profile.contact.phone?.trim()) factors.hasPhone = 4;

  if (digitalGaps.some((g) => g.id === 'social_only')) factors.socialOnlyPresence = 12;

  return applyBiScoringFactors(factors, hints);
}

function collectBriefEvidenceIds(
  pains: BoIStructuredPain[],
  digitalGaps: BoIDigitalGap[],
  max = 8,
): string[] {
  const ids: string[] = [];
  for (const pain of pains.slice(0, 4)) {
    for (const id of pain.evidenceIds) {
      if (!ids.includes(id)) ids.push(id);
      if (ids.length >= max) return ids;
    }
  }
  for (const gap of digitalGaps.slice(0, 4)) {
    for (const id of gap.evidenceIds) {
      if (!ids.includes(id)) ids.push(id);
      if (ids.length >= max) return ids;
    }
  }
  return ids;
}

function buildExecutiveSummary(input: {
  profile: BusinessIntelligenceProfile;
  pains: BoIStructuredPain[];
  digitalGaps: BoIDigitalGap[];
  solutions: BoISolution[];
  purchaseReadiness: BoIPurchaseReadiness;
  depth?: BoIDepthEnrichment;
}): string {
  const { profile, pains, digitalGaps, solutions, purchaseReadiness, depth } = input;
  const name = profile.identity.name;
  const city = profile.identity.city;
  const industry = profile.identity.industry;
  const location = city ? ` in ${city}` : '';
  const segment = industry ? ` (${industry})` : '';

  const topPain = pains[0]?.label;
  const topGap = digitalGaps[0]?.label;
  const topService = solutions[0]?.service;
  const readiness =
    purchaseReadiness.score != null
      ? ` Purchase readiness: ${purchaseReadiness.score}/100 (${purchaseReadiness.band}).`
      : '';

  const painClause = topPain ? ` Top pain: ${topPain}.` : '';
  const gapClause = topGap ? ` Key gap: ${topGap}.` : '';
  const serviceClause = topService ? ` Recommend starting with ${topService}.` : '';
  const valueClause =
    depth?.projectValue != null
      ? ` Indicative project band: ${formatUgxRange(depth.projectValue.minUgx, depth.projectValue.maxUgx)} (estimate).`
      : '';
  const sentimentClause =
    depth?.sentimentSummary?.complaintThemes[0] != null
      ? ` Review sentiment flags: ${depth.sentimentSummary.complaintThemes[0].label.toLowerCase()}.`
      : '';

  if (!topPain && !topGap) {
    return `${name}${segment}${location} — limited BOI evidence so far; validate needs on first contact.${readiness}`;
  }

  return `${name}${segment}${location} — opportunity identified from verified discovery data.${painClause}${gapClause}${serviceClause}${sentimentClause}${valueClause}${readiness}`;
}

/**
 * Rules-first one-page sales brief JSON for Business Opportunity Intelligence.
 */
export function buildSalesBrief(input: {
  profile: BusinessIntelligenceProfile;
  pains: BoIStructuredPain[];
  digitalGaps: BoIDigitalGap[];
  solutions: BoISolution[];
  purchaseReadiness: BoIPurchaseReadiness;
  evidence: BoIEvidence[];
  depth?: BoIDepthEnrichment;
}): BoISalesBrief {
  const { profile, pains, digitalGaps, solutions, purchaseReadiness, depth } = input;
  const hints = deriveBiScoringHints(biScoringInputFromProfile(profile));
  const factors = buildScoringFactors(profile, digitalGaps);
  const opportunity = deriveOpportunityBrief({
    factors,
    hasWebsite: profile.presence.hasWebsite,
    bi: hints,
    footprintPlatforms: profile.digitalFootprint.socialLinks.map((s) => s.platform),
  });

  const recommendedServices = [...new Set(solutions.map((s) => s.service))];
  const evidenceIds = collectBriefEvidenceIds(pains, digitalGaps);

  return {
    executiveSummary: buildExecutiveSummary({
      profile,
      pains,
      digitalGaps,
      solutions,
      purchaseReadiness,
      depth,
    }),
    narrativeSource: 'rules',
    pitchAngle: derivePitchAngle({
      factors,
      hasWebsite: profile.presence.hasWebsite,
      bi: hints,
    }),
    recommendedServices,
    topPainIds: pains.slice(0, 5).map((p) => p.id),
    gapIds: digitalGaps.slice(0, 5).map((g) => g.id),
    evidenceIds,
    opportunityType: OPPORTUNITY_TYPE_LABELS[opportunity.opportunityType],
  };
}
