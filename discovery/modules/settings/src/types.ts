export type AcquisitionMode = 'economy' | 'standard' | 'boost';

export type CredentialKey =
  | 'google_places_api_key'
  | 'google_places_api_keys'
  | 'google_cse_api_key'
  | 'google_cse_cx'
  | 'bing_search_key'
  | 'meta_graph_api_token'
  | 'gmail_oauth_client_id'
  | 'gmail_oauth_client_secret'
  | 'gmail_oauth_refresh_token'
  | 'openai_api_key'
  | 'openrouter_api_key'
  | 'xai_grok_api_key'
  | 'anthropic_api_key';

export interface PlacesRunSettings {
  /** Max Text Search calls per run in standard mode (verify pass for non-Places candidates) */
  standardVerifyMaxPerRun: number;
  /** Max Text Search calls per run in boost mode (incl. all-cities) */
  boostVerifyMaxPerRun: number;
  /** Max Text Search API calls per run for primary Places discovery (standard) */
  standardDiscoverMaxPerRun: number;
  /** Max Text Search API calls per run for primary Places discovery (boost) */
  boostDiscoverMaxPerRun: number;
  /** Results per Places Text Search page (max 20 per Google API) */
  discoverPageSize: number;
  /** Max Details API calls per run for top-scored accounts */
  detailsTopN: number;
  /** Minimum lead score to qualify for Details enrichment */
  detailsMinScore: number;
}

export interface AcquisitionSettings {
  mode: AcquisitionMode;
  caps: {
    google_places: number;
    google_cse: number;
    bing_search: number;
    browser_automation: number;
    custom_scrape: number;
    meta_graph: number;
    llm_narrative: number;
  };
  searchLimits: {
    economy: number;
    standard: number;
    boost: number;
  };
  metaGraphLimits: {
    economy: number;
    standard: number;
    boost: number;
  };
  socialSearchLimits: {
    economy: number;
    standard: number;
    boost: number;
  };
  placesTtlDays: number;
  places: PlacesRunSettings;
}

export interface DiscoveryDefaults {
  country: string;
  city: string;
  industry: string;
}

export interface DiscoveryOptionsSettings {
  countries: string[];
  industries: string[];
  citiesByCountry: Record<string, string[]>;
  allCitiesLabel: string;
  defaults: DiscoveryDefaults;
  csvImportPath: string;
}

export type CrawlStatusValue =
  | 'ok'
  | 'blocked'
  | 'unreachable'
  | 'no_website'
  | 'skipped'
  | 'budget_exhausted';

export interface CrawlSettings {
  enabled: boolean;
  maxPagesPerAccount: number;
  rateLimitMsPerDomain: number;
  fetchTimeoutMs: number;
  /** Paths probed on every site (e.g. /contact-us) */
  extraPaths: string[];
  /** Match href path or anchor text — contact-intent pages */
  contactLinkKeywords: string[];
  /** Match href path or anchor text — about/company pages */
  aboutLinkKeywords: string[];
  userAgent: string;
  trackBudget: boolean;
}

import type { LocaleSettings } from './locale-types';

export type { LocalePack, LocalePackToken, LocaleSettings, LocalePackImport } from './locale-types';

export interface CustomScrapeHealthState {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastError: string | null;
  recentDays: Array<{ date: string; attempted: boolean; success: boolean }>;
}

export interface CustomScrapeSettings {
  redditSubreddits: string[];
  health: CustomScrapeHealthState;
}

export interface IntentSettings {
  /** Up to 3 RSS/Atom feed URLs for demand signal polling */
  demandRssFeeds: string[];
  /** Tier 5 Reddit custom scrape (demand ingest only) */
  customScrape?: CustomScrapeSettings;
}

export type MinReachabilityLevel = 'low' | 'medium' | 'high';

export interface IcpSettings {
  /** When true, score no-website businesses as opportunity (web-agency ICP). */
  requireWebsiteOpportunity: boolean;
  /** Multiplier on demand signal score contribution. */
  demandWeightMultiplier: number;
  /** Minimum reachability for CSV export (and default review filter). */
  minReachabilityForExport: MinReachabilityLevel;
}

export interface QualificationSettings {
  /** When true, review queue defaults to verified prospects only (email, phone, or Places). */
  requireContactForReview: boolean;
  /** Default minimum score filter on review queue (0 = no default). */
  minScoreDefault: number;
  icp: IcpSettings;
}

export interface CrmSettings {
  /** Days after CONTACTED before follow-up appears due. */
  followUpDaysAfterContact: number;
}

export interface BoiSettings {
  /** Platform-wide gate for optional LLM executive summaries on BOI briefs. */
  llmNarrativeEnabled: boolean;
  /** OpenAI chat model for BOI narrative (when credential configured). */
  llmModel: string;
}

export type MarketHunterPlatformToggles = {
  codecanyon: boolean;
  getly: boolean;
  gumroad: boolean;
  producthunt: boolean;
  g2: boolean;
  reddit: boolean;
};

export type MarketHunterPlatformKey = keyof MarketHunterPlatformToggles;

/** Research listings/reviews — OpenRouter (default) or direct xAI Grok. */
export type MarketHunterResearchProvider = 'openrouter' | 'xai';

/** Complaint extraction — OpenRouter (default) or direct Anthropic. */
export type MarketHunterComplaintsProvider = 'openrouter' | 'anthropic';

export interface MarketHunterLlmSettings {
  researchProvider: MarketHunterResearchProvider;
  /** Model id — OpenRouter slug (e.g. perplexity/sonar) or xAI model (e.g. grok-3). */
  researchModel: string;
  complaintsProvider: MarketHunterComplaintsProvider;
  /** Model id — OpenRouter slug or Anthropic model id. */
  complaintsModel: string;
}

export interface MarketHunterCostEstimates {
  researchListingCallUsd: number;
  researchReviewsCallUsd: number;
  complaintAnalysisCallUsd: number;
}

export interface MarketHunterSettings {
  /** Master gate for Live Market Hunter product surface. */
  enabled: boolean;
  /** Hard USD cap per scan run (Grok + Claude). */
  maxSpendPerRunUsd: number;
  /** Default listings fetched per platform category per scan. */
  defaultListingLimit: number;
  /** Cron expression for scheduled scans (operator reference; enforced in Chunk 11). */
  scheduleCron: string;
  platforms: MarketHunterPlatformToggles;
  /** Per-platform category overrides. Empty/missing uses built-in defaults from platform-config. */
  platformCategories: Partial<Record<MarketHunterPlatformKey, string[]>>;
  llm: MarketHunterLlmSettings;
  costEstimates: MarketHunterCostEstimates;
  /** Shown on generated action cards (payout path). */
  paymentPath: string;
}

export interface PlatformSettings {
  acquisition: AcquisitionSettings;
  credentials: Partial<Record<CredentialKey, string>>;
  discovery: DiscoveryOptionsSettings;
  crawl: CrawlSettings;
  locales: LocaleSettings;
  intent: IntentSettings;
  qualification: QualificationSettings;
  crm: CrmSettings;
  boi: BoiSettings;
  marketHunter: MarketHunterSettings;
}

export type CredentialStatus = {
  key: CredentialKey;
  configured: boolean;
  source: 'env' | 'database' | 'none';
  hint?: string;
};

export const CREDENTIAL_ENV_MAP: Record<CredentialKey, string> = {
  google_places_api_key: 'GOOGLE_PLACES_API_KEY',
  google_places_api_keys: 'GOOGLE_PLACES_API_KEYS',
  google_cse_api_key: 'GOOGLE_CSE_API_KEY',
  google_cse_cx: 'GOOGLE_CSE_CX',
  bing_search_key: 'BING_SEARCH_KEY',
  meta_graph_api_token: 'META_GRAPH_API_TOKEN',
  gmail_oauth_client_id: 'GMAIL_OAUTH_CLIENT_ID',
  gmail_oauth_client_secret: 'GMAIL_OAUTH_CLIENT_SECRET',
  gmail_oauth_refresh_token: 'GMAIL_OAUTH_REFRESH_TOKEN',
  openai_api_key: 'OPENAI_API_KEY',
  openrouter_api_key: 'OPENROUTER_API_KEY',
  xai_grok_api_key: 'XAI_GROK_API_KEY',
  anthropic_api_key: 'ANTHROPIC_API_KEY',
};

export const SETTINGS_KEYS = {
  acquisition: 'platform.acquisition',
  credentials: 'platform.credentials',
  discovery: 'platform.discovery',
  crawl: 'platform.crawl',
  locales: 'platform.locales',
  intent: 'platform.intent',
  qualification: 'platform.qualification',
  crm: 'platform.crm',
  boi: 'platform.boi',
  marketHunter: 'platform.marketHunter',
} as const;
