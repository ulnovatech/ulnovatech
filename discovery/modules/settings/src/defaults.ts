import { ALL_CITIES, CITIES_BY_COUNTRY, COUNTRIES } from '@agency/geo';
import type { PlatformSettings } from './types';

export const DEFAULT_INDUSTRIES = [
  'Accounting',
  'Automotive',
  'Construction',
  'Dental',
  'E-commerce',
  'Education',
  'Fitness & Gym',
  'Healthcare',
  'Hospitality',
  'Legal',
  'Marketing Agency',
  'Non-profit',
  'Real Estate',
  'Restaurant',
  'Retail',
  'Salon & Spa',
  'Technology',
  'Travel',
  'Veterinary',
  'Web Development',
];

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envMode(): PlatformSettings['acquisition']['mode'] {
  const m = process.env.ACQUISITION_MODE?.trim().toLowerCase();
  if (m === 'economy' || m === 'standard' || m === 'boost') return m;
  return 'standard';
}

function envResearchProvider(): 'openrouter' | 'xai' {
  const p = process.env.MARKET_HUNTER_RESEARCH_PROVIDER?.trim().toLowerCase();
  if (p === 'xai') return 'xai';
  return 'openrouter';
}

function envComplaintsProvider(): 'openrouter' | 'anthropic' {
  const p = process.env.MARKET_HUNTER_COMPLAINTS_PROVIDER?.trim().toLowerCase();
  if (p === 'anthropic') return 'anthropic';
  return 'openrouter';
}

function defaultResearchModel(provider: 'openrouter' | 'xai'): string {
  const fromEnv = process.env.MARKET_HUNTER_RESEARCH_MODEL?.trim();
  if (fromEnv) return fromEnv;
  return provider === 'openrouter' ? 'perplexity/sonar' : 'grok-3';
}

function defaultComplaintsModel(provider: 'openrouter' | 'anthropic'): string {
  const fromEnv = process.env.MARKET_HUNTER_COMPLAINTS_MODEL?.trim();
  if (fromEnv) return fromEnv;
  return provider === 'openrouter'
    ? 'anthropic/claude-sonnet-4'
    : 'claude-sonnet-4-20250514';
}

export function buildDefaultPlatformSettings(): PlatformSettings {
  const researchProvider = envResearchProvider();
  const complaintsProvider = envComplaintsProvider();
  return {
    acquisition: {
      mode: envMode(),
      caps: {
        google_places: envInt('PLACES_MONTHLY_CAP', 150),
        google_cse: envInt('CSE_DAILY_CAP', 100),
        bing_search: envInt('BING_DAILY_CAP', 50),
        browser_automation: envInt('BROWSER_DAILY_CAP', 10),
        custom_scrape: envInt('CUSTOM_SCRAPE_DAILY_CAP', 50),
        meta_graph: envInt('META_GRAPH_DAILY_CAP', 50),
        llm_narrative: envInt('LLM_NARRATIVE_DAILY_CAP', 50),
      },
      searchLimits: {
        economy: 5,
        standard: 15,
        boost: 25,
      },
      metaGraphLimits: {
        economy: envInt('META_GRAPH_ECONOMY_MAX', 3),
        standard: envInt('META_GRAPH_STANDARD_MAX', 5),
        boost: envInt('META_GRAPH_BOOST_MAX', 10),
      },
      socialSearchLimits: {
        economy: envInt('SOCIAL_SEARCH_ECONOMY_MAX', 4),
        standard: envInt('SOCIAL_SEARCH_STANDARD_MAX', 5),
        boost: envInt('SOCIAL_SEARCH_BOOST_MAX', 5),
      },
      placesTtlDays: 90,
      places: {
        standardVerifyMaxPerRun: 20,
        boostVerifyMaxPerRun: 50,
        standardDiscoverMaxPerRun: envInt('PLACES_DISCOVER_STANDARD_MAX', 15),
        boostDiscoverMaxPerRun: envInt('PLACES_DISCOVER_BOOST_MAX', 40),
        discoverPageSize: Math.min(20, Math.max(1, envInt('PLACES_DISCOVER_PAGE_SIZE', 20))),
        detailsTopN: 20,
        detailsMinScore: 25,
      },
    },
    credentials: {},
    discovery: {
      countries: [...COUNTRIES],
      industries: [...DEFAULT_INDUSTRIES],
      citiesByCountry: { ...CITIES_BY_COUNTRY },
      allCitiesLabel: ALL_CITIES,
      defaults: {
        country: 'United States',
        city: ALL_CITIES,
        industry: 'Restaurant',
      },
      csvImportPath: 'storage/imports/businesses.csv',
    },
    crawl: {
      enabled: true,
      maxPagesPerAccount: 3,
      rateLimitMsPerDomain: 1000,
      fetchTimeoutMs: 8000,
      extraPaths: [
        '/contact',
        '/contact-us',
        '/contactus',
        '/get-in-touch',
        '/about',
        '/about-us',
      ],
      contactLinkKeywords: [
        'contact',
        'contact-us',
        'contactus',
        'get-in-touch',
        'reach-us',
        'reach-out',
        'support',
        'customer-service',
        'enquiry',
        'inquiry',
        'locations',
        'find-us',
        'visit-us',
      ],
      aboutLinkKeywords: [
        'about',
        'about-us',
        'aboutus',
        'our-story',
        'who-we-are',
        'company',
        'team',
      ],
      userAgent: 'AgencyPlatformBot/1.0',
      trackBudget: true,
    },
    locales: {
      useBuiltinLexicon: true,
      packs: [],
    },
    intent: {
      demandRssFeeds: [],
      customScrape: {
        redditSubreddits: ['forhire', 'entrepreneur', 'smallbusiness'],
        health: {
          lastSuccessAt: null,
          lastAttemptAt: null,
          lastError: null,
          recentDays: [],
        },
      },
    },
    qualification: {
      requireContactForReview: true,
      minScoreDefault: 0,
      icp: {
        requireWebsiteOpportunity: true,
        demandWeightMultiplier: 1,
        minReachabilityForExport: 'low',
      },
    },
    crm: {
      followUpDaysAfterContact: 3,
    },
    boi: {
      llmNarrativeEnabled: process.env.BOI_LLM_NARRATIVE_ENABLED?.trim().toLowerCase() === 'true',
      llmModel: process.env.BOI_LLM_MODEL?.trim() || 'gpt-4o-mini',
    },
    marketHunter: {
      enabled: process.env.MARKET_HUNTER_ENABLED?.trim().toLowerCase() === 'true',
      maxSpendPerRunUsd: envFloat('MARKET_HUNTER_MAX_SPEND_PER_RUN_USD', 0.5),
      defaultListingLimit: envInt('MARKET_HUNTER_DEFAULT_LISTING_LIMIT', 20),
      scheduleCron: process.env.MARKET_HUNTER_SCHEDULE_CRON?.trim() || '0 9 * * 1',
      platforms: {
        codecanyon: true,
        getly: true,
        gumroad: false,
        producthunt: true,
        g2: false,
        reddit: false,
      },
      platformCategories: {},
      llm: {
        researchProvider,
        researchModel: defaultResearchModel(researchProvider),
        complaintsProvider,
        complaintsModel: defaultComplaintsModel(complaintsProvider),
      },
      costEstimates: {
        researchListingCallUsd: envFloat('MARKET_HUNTER_COST_LISTING_USD', 0.002),
        researchReviewsCallUsd: envFloat('MARKET_HUNTER_COST_REVIEWS_USD', 0.001),
        complaintAnalysisCallUsd: envFloat('MARKET_HUNTER_COST_COMPLAINTS_USD', 0.003),
      },
      paymentPath:
        process.env.MARKET_HUNTER_PAYMENT_PATH?.trim() ||
        'Payoneer → Binance P2P → MTN/Airtel Mobile Money',
    },
  };
}

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallback;
}
