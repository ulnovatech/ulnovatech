export { DiscoveryService } from './service';

export { DiscoveryRepository } from './repository';

export {

  getConfiguredDiscoveryProviders,

  getDiscoveryProviderStatus,

  getAcquisitionModeLabel,

} from './providers/registry';

export { GooglePlacesVerifyProvider } from './providers/places/places-verify';
export { GooglePlacesDiscoveryProvider } from './providers/places/places-discover';
export { MetaGraphDiscoveryProvider } from './providers/meta/meta-graph-provider';
export { MetaGraphClient, MetaGraphApiError } from './providers/meta/meta-graph-client';
export { SocialSearchProvider } from './providers/social/social-search-provider';
export { parseSocialSearchResultItem } from './providers/social/parse-social-search-result';
export {
  placeSearchResultToDiscoveredBusiness,
  placesIdFromExternalId,
  normalizePlacesExternalId,
} from './providers/places/place-to-candidate';

export { GooglePlacesDetailsProvider } from './providers/places/places-details';

export { PlacesApiClient } from './providers/places/places-client';

export { buildPublicSearchQueries } from './lib/build-public-search-queries';
export { buildMetaSearchQueries } from './lib/build-meta-search-queries';
export { buildSocialSearchQueries } from './lib/build-social-search-queries';
export {
  classifySearchResult,
  isKeepableSearchResult,
  isLocalDirectoryHost,
  isExtractableDirectoryListing,
  isDirectoryListicleOrSearch,
  LOCAL_DIRECTORY_HOST_FRAGMENTS,
  type SearchResultKind,
  type SocialPlatform,
} from './providers/search-result-classifier';

export {
  parseSearchResultItem,
  extractDirectoryCandidate,
  extractBusinessNameFromDirectoryTitle,
  extractNameFromDirectoryUrl,
  extractExternalWebsiteFromSnippet,
} from './providers/parse-search-results';

export {
  getRunSearchQueryLimit,
  getSearchPagesPerQuery,
  getMetaGraphQueryLimit,
  getMetaGraphPagesPerQuery,
  getSocialSearchQueryLimit,
  getAcquisitionMode,
  profileToMode,
  modeToProfile,
  getRunProfileLabel,
  type RunProfile,
} from './lib/run-profile';

export type { DiscoveredBusiness, DiscoveryProvider, DiscoverySource } from './providers/types';

export { getRunWithEnrichedBusinesses } from './run-details';

export {
  computeRunYieldStats,
  refreshRunYieldStats,
  countBySource,
  type DiscoveryRunStats,
} from './run-yield-metrics';

export {
  countProspectCandidates,
  countHighPotentialEstimate,
  businessRowToProspectShape,
} from './lib/prospect-metrics';

export {
  parseCsvContent,
  normalizeCsvHeader,
  buildCsvTemplate,
  CSV_TEMPLATE_HEADERS,
} from './lib/parse-csv';
export {
  mapCsvRowToCandidate,
  mapCsvRowsToCandidates,
  rowMatchesRunFilters,
  hasRequiredNameColumn,
} from './lib/map-csv-row';
export {
  getCsvImportFileInfo,
  saveCsvImportFile,
  previewCsvContent,
  validateCsvForImport,
  loadCsvCandidates,
  getCsvTemplateContent,
  CSV_MAX_BYTES,
  CSV_MAX_ROWS,
  type CsvImportFileInfo,
  type CsvUploadResult,
  type CsvParsePreview,
} from './lib/csv-import-service';

export { shouldSpendPlacesLookup, shouldFetchPlaceExternalId } from './places-refresh';

export {
  normalizePlacesReviews,
  readPlacesReviewsFromMetadata,
  extractReviewSnippets,
  mineReviewPainKeywords,
  buildBusinessSignalsFromReviews,
  reviewPainSourceUrl,
  type PlacesReviewRecord,
  type ReviewSnippet,
  type ReviewPainMatch,
  type BusinessSignalsFromReviews,
} from './providers/places/review-pain-signals';

export { needsPlacesVerify } from './providers/places/needs-verify';

export { RedditIntentProvider, parseRedditListing } from './providers/custom/reddit-intent-provider';
export {
  emptyHealthState,
  isCustomScrapeDegraded,
  recordPollOutcome,
  type CustomScrapeHealthState,
  type DailyPollRecord,
} from './providers/custom/health';
export { CustomScrapeRateLimiter } from './providers/custom/rate-limiter';
export type { CustomDemandItem } from './providers/custom/types';

