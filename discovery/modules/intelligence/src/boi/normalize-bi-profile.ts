import type { BiBusinessSignals, BiCompleteness, BusinessIntelligenceProfile } from '../bi/types';
import { emptyOpportunityIntelligence } from './empty-opportunity-intelligence';
import type { BoIOpportunityIntelligence } from './types';

const BI_PROFILE_SCHEMA_VERSION = 2 as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseOpportunityIntelligence(raw: unknown): BoIOpportunityIntelligence | null {
  if (!isRecord(raw)) return null;
  if (raw.schemaVersion !== 1) return null;

  const status = raw.status;
  if (status !== 'pending' && status !== 'ready' && status !== 'partial') return null;

  return {
    schemaVersion: 1,
    status,
    synthesizedAt: typeof raw.synthesizedAt === 'string' ? raw.synthesizedAt : null,
    evidence: Array.isArray(raw.evidence) ? (raw.evidence as BoIOpportunityIntelligence['evidence']) : [],
    digitalGaps: Array.isArray(raw.digitalGaps)
      ? (raw.digitalGaps as BoIOpportunityIntelligence['digitalGaps'])
      : [],
    pains: Array.isArray(raw.pains) ? (raw.pains as BoIOpportunityIntelligence['pains']) : [],
    solutions: Array.isArray(raw.solutions)
      ? (raw.solutions as BoIOpportunityIntelligence['solutions'])
      : [],
    purchaseReadiness: isRecord(raw.purchaseReadiness)
      ? (raw.purchaseReadiness as BoIOpportunityIntelligence['purchaseReadiness'])
      : null,
    salesBrief: isRecord(raw.salesBrief)
      ? (raw.salesBrief as BoIOpportunityIntelligence['salesBrief'])
      : null,
    sentimentSummary: isRecord(raw.sentimentSummary)
      ? (raw.sentimentSummary as BoIOpportunityIntelligence['sentimentSummary'])
      : null,
    techStack: isRecord(raw.techStack)
      ? (raw.techStack as BoIOpportunityIntelligence['techStack'])
      : null,
    projectValue: isRecord(raw.projectValue)
      ? (raw.projectValue as BoIOpportunityIntelligence['projectValue'])
      : null,
    pageSpeed: isRecord(raw.pageSpeed)
      ? (raw.pageSpeed as BoIOpportunityIntelligence['pageSpeed'])
      : null,
  };
}

function hasBiCoreShape(raw: Record<string, unknown>): boolean {
  return (
    typeof raw.accountId === 'string' &&
    typeof raw.businessId === 'string' &&
    isRecord(raw.identity) &&
    isRecord(raw.contact) &&
    isRecord(raw.presence) &&
    isRecord(raw.digitalFootprint) &&
    isRecord(raw.websiteIntel) &&
    isRecord(raw.infrastructure) &&
    isRecord(raw.businessSignals)
  );
}

/** Attach v2 BOI shell to a profile built without opportunityIntelligence. */
export function attachOpportunityIntelligenceShell(
  profile: Omit<BusinessIntelligenceProfile, 'opportunityIntelligence' | 'schemaVersion'> & {
    schemaVersion?: 1 | 2;
    opportunityIntelligence?: BoIOpportunityIntelligence;
  },
): BusinessIntelligenceProfile {
  return {
    ...profile,
    schemaVersion: BI_PROFILE_SCHEMA_VERSION,
    opportunityIntelligence: profile.opportunityIntelligence ?? emptyOpportunityIntelligence(),
    completeness: profile.completeness,
  };
}

/**
 * Parse BI profile JSON from DB — accepts legacy v1 rows and upgrades in memory.
 */
export function normalizeBusinessIntelligenceProfile(
  raw: unknown,
): BusinessIntelligenceProfile | null {
  if (!isRecord(raw) || !hasBiCoreShape(raw)) return null;

  const schemaVersion = raw.schemaVersion === 2 ? 2 : 1;
  const completeness = isRecord(raw.completeness)
    ? (raw.completeness as BiCompleteness)
    : { score: 0, filledFields: [], missingFields: [] };

  const base = {
    accountId: raw.accountId as string,
    businessId: raw.businessId as string,
    discoveryRunId: typeof raw.discoveryRunId === 'string' ? raw.discoveryRunId : undefined,
    enrichedAt: typeof raw.enrichedAt === 'string' ? raw.enrichedAt : new Date().toISOString(),
    identity: raw.identity as BusinessIntelligenceProfile['identity'],
    contact: raw.contact as BusinessIntelligenceProfile['contact'],
    presence: raw.presence as BusinessIntelligenceProfile['presence'],
    digitalFootprint: raw.digitalFootprint as BusinessIntelligenceProfile['digitalFootprint'],
    websiteIntel: raw.websiteIntel as BusinessIntelligenceProfile['websiteIntel'],
    infrastructure: raw.infrastructure as BusinessIntelligenceProfile['infrastructure'],
    businessSignals: raw.businessSignals as BiBusinessSignals,
    completeness,
  };

  if (schemaVersion === 1) {
    return {
      schemaVersion: 1,
      ...base,
    };
  }

  const opportunityIntelligence =
    parseOpportunityIntelligence(raw.opportunityIntelligence) ?? emptyOpportunityIntelligence();

  return {
    schemaVersion: 2,
    ...base,
    opportunityIntelligence,
  };
}

export function getBiProfileSchemaVersion(profile: BusinessIntelligenceProfile): 1 | 2 {
  return profile.schemaVersion === 2 ? 2 : 1;
}

export { BI_PROFILE_SCHEMA_VERSION };
