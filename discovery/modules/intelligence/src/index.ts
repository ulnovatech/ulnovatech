export { IntelligenceService } from './service';
export { CrawlService, type CrawlResult, type CrawlContext } from './crawl/crawl-service';
export { analyzeWebsite, type AnalysisResult } from './analyzer';
export { BrowserCrawlService } from './browser/browser-crawl-service';
export { isBrowserEnrichEligible } from './browser/eligibility';
export { runBrowserEnrichForRun, type BrowserEnrichRunResult } from './browser/run-browser-enrich';
export { BiProfileService } from './bi/bi-profile-service';
export { buildBusinessIntelligenceProfile, readCrawlFootprintSources } from './bi/build-profile';
export { buildRelationshipGraph, graphSummary } from './bi/build-relationship-graph';
export { computeBiCompleteness } from './bi/compute-completeness';
export {
  detectSocialPlatform,
  mergeSocialLinks,
  socialLinkFromUrl,
} from './bi/social-links';
export {
  enrichDigitalFootprint,
  parseLinkInBioHtml,
  resolveLinkInBioUrls,
} from './bi/link-in-bio';
export {
  extractSocialUrlsFromHtml,
  isLinkInBioHost,
  isLinkInBioUrl,
  mergeExtractedSocial,
} from './crawl/extract-social-links';
export {
  auditInfrastructureHtml,
  emptyInfrastructureAudit,
  finalizeInfrastructureAudit,
  mergeInfrastructureAudits,
  deriveOpportunityFlags,
} from './crawl/infrastructure-audit';
export type {
  BusinessIntelligenceProfile,
  BiSocialLink,
  BiSocialPlatform,
  BiCompleteness,
  BiEnrichRunResult,
  BiLinkInBioPage,
  BiRelationshipGraph,
  BiGraphNode,
  BiGraphEdge,
  BiReviewSnippet,
  BiReviewPainSignal,
  BiBusinessSignals,
  InfrastructureAudit,
  InfrastructureSignal,
  InfrastructureFlags,
  InfrastructureCategory,
  InfrastructureConfidence,
} from './bi/types';

export type {
  BoIEvidence,
  BoIEvidenceSource,
  BoIDigitalGap,
  BoIGapSeverity,
  BoIStructuredPain,
  BoISolution,
  BoISolutionBenefit,
  BoIPurchaseReadiness,
  BoIReadinessBand,
  BoISalesBrief,
  BoINarrativeSource,
  BoIOpportunityIntelligence,
  BoIOpportunityStatus,
  BoISentimentSummary,
  BoISentimentTheme,
  BoISentimentThemeKind,
  BoITechStack,
  BoITechStackItem,
  BoITechStackCategory,
  BoIProjectValueEstimate,
  BoIProjectValueBand,
  BoIPageSpeedSnapshot,
} from './boi/types';

export { emptyOpportunityIntelligence } from './boi/empty-opportunity-intelligence';
export {
  attachOpportunityIntelligenceShell,
  normalizeBusinessIntelligenceProfile,
  getBiProfileSchemaVersion,
  BI_PROFILE_SCHEMA_VERSION,
} from './boi/normalize-bi-profile';
export { BoIEvidenceRegistry, mapSignalSourceToEvidenceSource } from './boi/evidence-registry';
export { buildDigitalGaps } from './boi/build-digital-gaps';
export {
  buildStructuredPains,
  buildBoIGapsAndPains,
  type BoIIntentSignalInput,
} from './boi/build-structured-pains';
export { mapPainsToSolutions } from './boi/map-pains-to-solutions';
export { computePurchaseReadiness } from './boi/compute-purchase-readiness';
export { buildSalesBrief } from './boi/build-sales-brief';
export { buildSentimentSummary } from './boi/build-sentiment-summary';
export { detectTechStack } from './crawl/tech-stack-detect';
export { estimateProjectValue, formatUgxRange } from './boi/estimate-project-value';
export { buildDepthEnrichment, type BoIDepthEnrichment } from './boi/build-depth-enrichment';
export { fetchPageSpeedIfConfigured } from './boi/fetch-page-speed';
export { synthesizeOpportunityIntelligence } from './boi/synthesize-opportunity-intelligence';
export {
  maybeEnhanceBoiNarrative,
  validateLlmNarrativePatch,
  type LlmNarrativeContext,
  type LlmNarrativeDeps,
} from './boi/llm-narrative';
export {
  buildOutreachOpener,
  type BuildOutreachOpenerInput,
  type OutreachOpenerResult,
} from './boi/build-outreach-opener';
export {
  readBoiFromProfile,
  writeBoiToProfile,
  isBoiAvailable,
  buildOpportunityBriefPayload,
  type BoIOpportunityBriefPayload,
} from './boi/boi-repository';
