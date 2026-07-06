export {
  MARKET_HUNTER_PLATFORMS,
  type MarketHunterPlatformKey,
  type MhScanStatus,
  type MhScanJobStatus,
  type MhActionCardStatus,
  type MhSpendProvider,
  type MarketHunterScan,
  type MarketHunterPlatformHealth,
  type MarketHunterCredentialHealth,
  type MarketHunterHealth,
} from './types';

export { PLATFORM_LABELS } from './platform-keys';
export { MarketHunterRepository } from './repository';
export { getMarketHunterHealth } from './health';

export {
  COST_ESTIMATES,
  getCostEstimates,
  MarketHunterBudgetGuard,
  type MarketHunterSpendGuard,
} from './budget.guard';

export {
  GrokResearchError,
  researchPlatformListings,
  researchListingReviews,
  type GrokCallContext,
  type GrokClientDeps,
} from './research/grok.client';
export {
  GrokParseError,
  parseGrokJsonContent,
  validateGrokListingsPayload,
  validateGrokReviewTexts,
  normalizeGrokListing,
  extractGrokResponseText,
} from './research/grok.parser';
export type { RawGrokListing, GrokResearchRequest, GrokReviewsRequest } from './research/grok.types';

export type {
  PlatformAdapter,
  PlatformMechanics,
  PlatformRole,
  PlatformSortOrder,
  MarketplaceListing,
  FetchListingsParams,
} from './platforms/base.adapter';
export { listingKey } from './platforms/base.adapter';

export {
  PLATFORM_CONFIG,
  validatePlatformConfig,
  validateAllPlatformConfigs,
  getPlatformConfig,
  getDefaultPlatformCategories,
  type PlatformConfigEntry,
} from './platforms/platform-config';

export {
  registerPlatformAdapter,
  getRegisteredAdapter,
  isAdapterRegistered,
  listRegisteredAdapterKeys,
  getEnabledPlatformConfigs,
  getGapScoringPlatformConfigs,
  listScanTargets,
  getEnabledAdapters,
  getAdapterForPlatform,
  resolvePlatformCategories,
  getResolvedPlatformConfig,
} from './platforms/registry';

export {
  codecanyonAdapter,
  setCodeCanyonAdapterContext,
  type CodeCanyonAdapterContext,
} from './platforms/codecanyon.adapter';
export { getlyAdapter } from './platforms/getly.adapter';
export { gumroadAdapter } from './platforms/gumroad.adapter';
export { producthuntAdapter } from './platforms/producthunt.adapter';
export { g2Adapter } from './platforms/g2.adapter';
export { redditAdapter } from './platforms/reddit.adapter';
export {
  setAdapterScanContext,
  getAdapterScanContext,
  type AdapterScanContext,
} from './platforms/adapter-context';
export { createGrokMarketplaceAdapter, registerGrokMarketplaceAdapter } from './platforms/grok-adapter.factory';

export { runScanPipeline, type ScanPipelineStats, type Type1DemandFlag, type OrchestratorDeps } from './orchestrator';

export type {
  ComplaintSignal,
  ComplaintAnalysis,
  GapType,
  GapScore,
  GhostVerdict,
  VisibilityRisk,
  VisibilityVerdict,
  CategoryMetrics,
} from './scoring/types';
export { EMPTY_COMPLAINT_ANALYSIS } from './scoring/types';
export { monthsBetween } from './scoring/date.utils';
export { detectGhost, filterGhosts, type GhostFilterOptions } from './scoring/ghost.filter';
export { scoreListing, type GapScoreOptions } from './scoring/gap.scorer';
export { checkVisibility, isEligibleForActionCard } from './scoring/visibility.checker';
export { computeCategoryMetrics, type CategoryMetricsOptions } from './scoring/category.metrics';

export {
  ClaudeExtractionError,
  extractComplaints,
  type ClaudeExtractionContext,
  type ClaudeClientDeps,
} from './research/claude.client';
export {
  OpenRouterError,
  callOpenRouterChat,
  type OpenRouterCallContext,
  type OpenRouterClientDeps,
} from './research/openrouter.client';
export {
  getMarketHunterLlmSettings,
  getResearchProvider,
  getComplaintsProvider,
  getResearchModel,
  getComplaintsModel,
  getPaymentPath,
  DEFAULT_COST_ESTIMATES,
} from './research/llm.config';
export {
  ClaudeParseError,
  parseClaudeJsonContent,
  validateComplaintAnalysis,
  extractClaudeResponseText,
} from './research/claude.parser';

export {
  generateActionCard,
  sortActionCards,
  rerankActionCards,
  type ActionCard,
  type ActionCardConfidence,
} from './output/action-card';

export { MarketHunterService } from './service';

import './platforms/bootstrap';
