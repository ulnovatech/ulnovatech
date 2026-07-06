import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIOpportunityIntelligence } from './types';

export function readBoiFromProfile(
  profile: BusinessIntelligenceProfile,
): BoIOpportunityIntelligence | null {
  if (profile.schemaVersion !== 2) return null;
  return profile.opportunityIntelligence ?? null;
}

export function isBoiAvailable(boi: BoIOpportunityIntelligence | null | undefined): boolean {
  if (!boi) return false;
  if (boi.status === 'pending' && !boi.synthesizedAt) return false;
  return boi.synthesizedAt != null;
}

export function writeBoiToProfile(
  profile: BusinessIntelligenceProfile,
  boi: BoIOpportunityIntelligence,
): BusinessIntelligenceProfile {
  return {
    ...profile,
    schemaVersion: 2,
    opportunityIntelligence: boi,
  };
}

export type BoIOpportunityBriefPayload = {
  businessId: string;
  accountId: string;
  status: BoIOpportunityIntelligence['status'];
  synthesizedAt: string | null;
  salesBrief: BoIOpportunityIntelligence['salesBrief'];
  purchaseReadiness: BoIOpportunityIntelligence['purchaseReadiness'];
  pains: BoIOpportunityIntelligence['pains'];
  digitalGaps: BoIOpportunityIntelligence['digitalGaps'];
  solutions: BoIOpportunityIntelligence['solutions'];
  evidence: BoIOpportunityIntelligence['evidence'];
  sentimentSummary: BoIOpportunityIntelligence['sentimentSummary'];
  techStack: BoIOpportunityIntelligence['techStack'];
  projectValue: BoIOpportunityIntelligence['projectValue'];
  pageSpeed: BoIOpportunityIntelligence['pageSpeed'];
};

export function buildOpportunityBriefPayload(
  profile: BusinessIntelligenceProfile,
): BoIOpportunityBriefPayload | null {
  const boi = readBoiFromProfile(profile);
  if (!boi || !isBoiAvailable(boi)) return null;

  return {
    businessId: profile.businessId,
    accountId: profile.accountId,
    status: boi.status,
    synthesizedAt: boi.synthesizedAt,
    salesBrief: boi.salesBrief,
    purchaseReadiness: boi.purchaseReadiness,
    pains: boi.pains,
    digitalGaps: boi.digitalGaps,
    solutions: boi.solutions,
    evidence: boi.evidence,
    sentimentSummary: boi.sentimentSummary,
    techStack: boi.techStack,
    projectValue: boi.projectValue,
    pageSpeed: boi.pageSpeed,
  };
}
