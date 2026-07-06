import path from 'path';
import { buildDefaultPlatformSettings } from './defaults';
import { SettingsRepository } from './repository';
import {
  CREDENTIAL_ENV_MAP,
  SETTINGS_KEYS,
  type AcquisitionMode,
  type AcquisitionSettings,
  type CredentialKey,
  type CredentialStatus,
  type CrawlSettings,
  type DiscoveryOptionsSettings,
  type IntentSettings,
  type LocaleSettings,
  type PlatformSettings,
  type QualificationSettings,
  type CrmSettings,
  type BoiSettings,
  type MarketHunterSettings,
} from './types';

function deepMergeAcquisition(
  base: AcquisitionSettings,
  patch: Partial<AcquisitionSettings>,
): AcquisitionSettings {
  return {
    ...base,
    ...patch,
    caps: { ...base.caps, ...patch.caps },
    searchLimits: { ...base.searchLimits, ...patch.searchLimits },
    metaGraphLimits: { ...base.metaGraphLimits, ...patch.metaGraphLimits },
    socialSearchLimits: { ...base.socialSearchLimits, ...patch.socialSearchLimits },
    places: { ...base.places, ...patch.places },
  };
}

function deepMergeDiscovery(
  base: DiscoveryOptionsSettings,
  patch: Partial<DiscoveryOptionsSettings>,
): DiscoveryOptionsSettings {
  return {
    ...base,
    ...patch,
    defaults: { ...base.defaults, ...patch.defaults },
    citiesByCountry: patch.citiesByCountry ?? base.citiesByCountry,
  };
}

function deepMergeLocales(base: LocaleSettings, patch: Partial<LocaleSettings>): LocaleSettings {
  return {
    ...base,
    ...patch,
    packs: patch.packs ?? base.packs,
  };
}

function deepMergeIntent(base: IntentSettings, patch: Partial<IntentSettings>): IntentSettings {
  const customScrape = patch.customScrape
    ? {
        redditSubreddits: (
          patch.customScrape.redditSubreddits ??
          base.customScrape?.redditSubreddits ??
          []
        ).slice(0, 5),
        health: {
          ...(base.customScrape?.health ?? {
            lastSuccessAt: null,
            lastAttemptAt: null,
            lastError: null,
            recentDays: [],
          }),
          ...patch.customScrape.health,
          recentDays: patch.customScrape.health?.recentDays ?? base.customScrape?.health?.recentDays ?? [],
        },
      }
    : base.customScrape;

  return {
    ...base,
    ...patch,
    demandRssFeeds: (patch.demandRssFeeds ?? base.demandRssFeeds).slice(0, 3),
    customScrape,
  };
}

function deepMergeCrawl(base: CrawlSettings, patch: Partial<CrawlSettings>): CrawlSettings {
  return {
    ...base,
    ...patch,
    extraPaths: patch.extraPaths ?? base.extraPaths,
    contactLinkKeywords: patch.contactLinkKeywords ?? base.contactLinkKeywords,
    aboutLinkKeywords: patch.aboutLinkKeywords ?? base.aboutLinkKeywords,
  };
}

export class SettingsService {
  private repo = new SettingsRepository();
  private snapshot: PlatformSettings | null = null;

  invalidate() {
    this.snapshot = null;
  }

  async ensureLoaded(): Promise<PlatformSettings> {
    if (this.snapshot) return this.snapshot;
    this.snapshot = await this.loadFromDatabase();
    return this.snapshot;
  }

  getSync(): PlatformSettings {
    if (!this.snapshot) {
      return buildDefaultPlatformSettings();
    }
    return this.snapshot;
  }

  async loadFromDatabase(): Promise<PlatformSettings> {
    const defaults = buildDefaultPlatformSettings();
    const [acq, creds, disc, crawl, locales, intent, qualification, crm, boi, marketHunter] =
      await Promise.all([
      this.repo.getJson<AcquisitionSettings>(SETTINGS_KEYS.acquisition),
      this.repo.getJson<Partial<Record<CredentialKey, string>>>(SETTINGS_KEYS.credentials),
      this.repo.getJson<DiscoveryOptionsSettings>(SETTINGS_KEYS.discovery),
      this.repo.getJson<CrawlSettings>(SETTINGS_KEYS.crawl),
      this.repo.getJson<LocaleSettings>(SETTINGS_KEYS.locales),
      this.repo.getJson<IntentSettings>(SETTINGS_KEYS.intent),
      this.repo.getJson<QualificationSettings>(SETTINGS_KEYS.qualification),
      this.repo.getJson<CrmSettings>(SETTINGS_KEYS.crm),
      this.repo.getJson<BoiSettings>(SETTINGS_KEYS.boi),
      this.repo.getJson<MarketHunterSettings>(SETTINGS_KEYS.marketHunter),
    ]);

    return {
      acquisition: acq ? deepMergeAcquisition(defaults.acquisition, acq) : defaults.acquisition,
      credentials: { ...defaults.credentials, ...creds },
      discovery: disc ? deepMergeDiscovery(defaults.discovery, disc) : defaults.discovery,
      crawl: crawl ? deepMergeCrawl(defaults.crawl, crawl) : defaults.crawl,
      locales: locales ? deepMergeLocales(defaults.locales, locales) : defaults.locales,
      intent: intent ? deepMergeIntent(defaults.intent, intent) : defaults.intent,
      qualification: qualification
        ? {
            ...defaults.qualification,
            ...qualification,
            icp: { ...defaults.qualification.icp, ...qualification.icp },
          }
        : defaults.qualification,
      crm: crm ? { ...defaults.crm, ...crm } : defaults.crm,
      boi: boi ? { ...defaults.boi, ...boi } : defaults.boi,
      marketHunter: marketHunter
        ? {
            ...defaults.marketHunter,
            ...marketHunter,
            platforms: { ...defaults.marketHunter.platforms, ...marketHunter.platforms },
            platformCategories: {
              ...defaults.marketHunter.platformCategories,
              ...marketHunter.platformCategories,
            },
            llm: { ...defaults.marketHunter.llm, ...marketHunter.llm },
            costEstimates: {
              ...defaults.marketHunter.costEstimates,
              ...marketHunter.costEstimates,
            },
          }
        : defaults.marketHunter,
    };
  }

  async seedDefaultsIfEmpty() {
    const existing = await this.repo.getJson(SETTINGS_KEYS.acquisition);
    if (existing) return false;
    const defaults = buildDefaultPlatformSettings();
    await this.savePlatformSettings(defaults);
    return true;
  }

  async savePlatformSettings(settings: PlatformSettings) {
    await this.repo.setJson(SETTINGS_KEYS.acquisition, settings.acquisition as unknown as Record<string, unknown>);
    await this.repo.setJson(SETTINGS_KEYS.credentials, settings.credentials as unknown as Record<string, unknown>);
    await this.repo.setJson(SETTINGS_KEYS.discovery, settings.discovery as unknown as Record<string, unknown>);
    await this.repo.setJson(SETTINGS_KEYS.crawl, settings.crawl as unknown as Record<string, unknown>);
    await this.repo.setJson(SETTINGS_KEYS.locales, settings.locales as unknown as Record<string, unknown>);
    await this.repo.setJson(SETTINGS_KEYS.intent, settings.intent as unknown as Record<string, unknown>);
    await this.repo.setJson(
      SETTINGS_KEYS.qualification,
      settings.qualification as unknown as Record<string, unknown>,
    );
    await this.repo.setJson(SETTINGS_KEYS.crm, settings.crm as unknown as Record<string, unknown>);
    await this.repo.setJson(SETTINGS_KEYS.boi, settings.boi as unknown as Record<string, unknown>);
    await this.repo.setJson(
      SETTINGS_KEYS.marketHunter,
      settings.marketHunter as unknown as Record<string, unknown>,
    );
    this.snapshot = settings;
  }

  async updateAcquisition(patch: Partial<AcquisitionSettings>) {
    const current = await this.ensureLoaded();
    const next = deepMergeAcquisition(current.acquisition, patch);
    await this.repo.setJson(SETTINGS_KEYS.acquisition, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, acquisition: next };
    return next;
  }

  async updateDiscovery(patch: Partial<DiscoveryOptionsSettings>) {
    const current = await this.ensureLoaded();
    const next = deepMergeDiscovery(current.discovery, patch);
    await this.repo.setJson(SETTINGS_KEYS.discovery, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, discovery: next };
    return next;
  }

  async updateCrawl(patch: Partial<CrawlSettings>) {
    const current = await this.ensureLoaded();
    const next = deepMergeCrawl(current.crawl, patch);
    await this.repo.setJson(SETTINGS_KEYS.crawl, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, crawl: next };
    return next;
  }

  getCrawlSettings(settings?: PlatformSettings): CrawlSettings {
    return (settings ?? this.getSync()).crawl;
  }

  async updateCredentials(patch: Partial<Record<CredentialKey, string>>) {
    const current = await this.ensureLoaded();
    const next = { ...current.credentials };
    for (const [key, value] of Object.entries(patch) as [CredentialKey, string][]) {
      if (value === '' || value === undefined) delete next[key];
      else next[key] = value.trim();
    }
    await this.repo.setJson(SETTINGS_KEYS.credentials, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, credentials: next };
    return next;
  }

  getCredential(key: CredentialKey, settings?: PlatformSettings): string | undefined {
    const snap = settings ?? this.getSync();
    const fromDb = snap.credentials[key]?.trim();
    if (fromDb) return fromDb;
    const envName = CREDENTIAL_ENV_MAP[key];
    return process.env[envName]?.trim() || undefined;
  }

  getCredentialStatuses(settings?: PlatformSettings): CredentialStatus[] {
    const snap = settings ?? this.getSync();
    return (Object.keys(CREDENTIAL_ENV_MAP) as CredentialKey[]).map((key) => {
      const envName = CREDENTIAL_ENV_MAP[key];
      const fromDb = snap.credentials[key]?.trim();
      const fromEnv = process.env[envName]?.trim();
      const configured = !!(fromDb || fromEnv);
      let source: CredentialStatus['source'] = 'none';
      if (fromDb) source = 'database';
      else if (fromEnv) source = 'env';
      return {
        key,
        configured,
        source,
        hint:
          fromDb
            ? 'Stored in Settings'
            : fromEnv
              ? `Using ${envName} env fallback (set key in Settings to prefer UI)`
              : undefined,
      };
    });
  }

  getAcquisitionMode(settings?: PlatformSettings): AcquisitionMode {
    return (settings ?? this.getSync()).acquisition.mode;
  }

  getRunSearchQueryLimit(mode?: AcquisitionMode, settings?: PlatformSettings) {
    const snap = settings ?? this.getSync();
    const m = mode ?? snap.acquisition.mode;
    return snap.acquisition.searchLimits[m];
  }

  getMetaGraphQueryLimit(mode?: AcquisitionMode, settings?: PlatformSettings) {
    const snap = settings ?? this.getSync();
    const m = mode ?? snap.acquisition.mode;
    return snap.acquisition.metaGraphLimits[m];
  }

  getSocialSearchQueryLimit(mode?: AcquisitionMode, settings?: PlatformSettings) {
    const snap = settings ?? this.getSync();
    const m = mode ?? snap.acquisition.mode;
    return snap.acquisition.socialSearchLimits[m];
  }

  googleMapsEnabledInMode(mode?: AcquisitionMode) {
    return (mode ?? this.getAcquisitionMode()) !== 'economy';
  }

  getBudgetCap(provider: keyof AcquisitionSettings['caps'], settings?: PlatformSettings): number {
    return (settings ?? this.getSync()).acquisition.caps[provider];
  }

  getPlacesTtlDays(settings?: PlatformSettings): number {
    return (settings ?? this.getSync()).acquisition.placesTtlDays;
  }

  isAllCities(city: string, settings?: PlatformSettings): boolean {
    const label = (settings ?? this.getSync()).discovery.allCitiesLabel;
    return city.trim().toLowerCase() === label.trim().toLowerCase();
  }

  citiesForCountry(country: string, settings?: PlatformSettings): string[] {
    const snap = settings ?? this.getSync();
    const specific = snap.discovery.citiesByCountry[country] ?? [];
    return [snap.discovery.allCitiesLabel, ...specific];
  }

  specificCitiesForCountry(country: string, settings?: PlatformSettings): string[] {
    return (settings ?? this.getSync()).discovery.citiesByCountry[country] ?? [];
  }

  resolveCsvPath(settings?: PlatformSettings): string {
    const rel = (settings ?? this.getSync()).discovery.csvImportPath;
    return path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
  }

  getPlacesRunSettings(settings?: PlatformSettings) {
    return (settings ?? this.getSync()).acquisition.places;
  }

  getPlacesVerifyMaxPerRun(mode?: AcquisitionMode, settings?: PlatformSettings): number {
    const snap = settings ?? this.getSync();
    const m = mode ?? snap.acquisition.mode;
    return m === 'boost'
      ? snap.acquisition.places.boostVerifyMaxPerRun
      : snap.acquisition.places.standardVerifyMaxPerRun;
  }

  getPlacesDiscoverMaxPerRun(mode?: AcquisitionMode, settings?: PlatformSettings): number {
    const snap = settings ?? this.getSync();
    const m = mode ?? snap.acquisition.mode;
    if (m === 'economy') return 0;
    const places = snap.acquisition.places;
    return m === 'boost'
      ? (places.boostDiscoverMaxPerRun ?? 40)
      : (places.standardDiscoverMaxPerRun ?? 15);
  }

  getPlacesDiscoverPageSize(settings?: PlatformSettings): number {
    const pageSize = (settings ?? this.getSync()).acquisition.places.discoverPageSize;
    return pageSize ?? 20;
  }

  /** All Places API keys — Settings UI first; env is CI/deploy fallback only. */
  getPlacesApiKeys(settings?: PlatformSettings): string[] {
    const snap = settings ?? this.getSync();

    const dbMulti = snap.credentials.google_places_api_keys
      ?.split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (dbMulti?.length) return dbMulti;

    const dbSingle = snap.credentials.google_places_api_key?.trim();
    if (dbSingle) return [dbSingle];

    const envMulti = process.env.GOOGLE_PLACES_API_KEYS?.split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (envMulti?.length) return envMulti;

    const envSingle = process.env.GOOGLE_PLACES_API_KEY?.trim();
    return envSingle ? [envSingle] : [];
  }

  isPlacesConfigured(settings?: PlatformSettings): boolean {
    return this.getPlacesApiKeys(settings).length > 0;
  }

  async updateLocales(patch: Partial<LocaleSettings>) {
    const current = await this.ensureLoaded();
    const next = deepMergeLocales(current.locales, patch);
    await this.repo.setJson(SETTINGS_KEYS.locales, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, locales: next };
    return next;
  }

  getLocaleSettings(settings?: PlatformSettings): LocaleSettings {
    return (settings ?? this.getSync()).locales;
  }

  async updateIntent(patch: Partial<IntentSettings>) {
    const current = await this.ensureLoaded();
    const next = deepMergeIntent(current.intent, patch);
    await this.repo.setJson(SETTINGS_KEYS.intent, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, intent: next };
    return next;
  }

  getIntentSettings(settings?: PlatformSettings): IntentSettings {
    return (settings ?? this.getSync()).intent;
  }

  async updateQualification(patch: Partial<QualificationSettings>) {
    const current = await this.ensureLoaded();
    const next = {
      ...current.qualification,
      ...patch,
      icp: patch.icp
        ? { ...current.qualification.icp, ...patch.icp }
        : current.qualification.icp,
    };
    await this.repo.setJson(SETTINGS_KEYS.qualification, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, qualification: next };
    return next;
  }

  getQualificationSettings(settings?: PlatformSettings): QualificationSettings {
    return (settings ?? this.getSync()).qualification;
  }

  async updateCrm(patch: Partial<CrmSettings>) {
    const current = await this.ensureLoaded();
    const next = { ...current.crm, ...patch };
    await this.repo.setJson(SETTINGS_KEYS.crm, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, crm: next };
    return next;
  }

  getCrmSettings(settings?: PlatformSettings): CrmSettings {
    return (settings ?? this.getSync()).crm;
  }

  async updateBoi(patch: Partial<BoiSettings>) {
    const current = await this.ensureLoaded();
    const next = { ...current.boi, ...patch };
    await this.repo.setJson(SETTINGS_KEYS.boi, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, boi: next };
    return next;
  }

  getBoiSettings(settings?: PlatformSettings): BoiSettings {
    return (settings ?? this.getSync()).boi;
  }

  async updateMarketHunter(patch: Partial<MarketHunterSettings>) {
    const current = await this.ensureLoaded();
    const next: MarketHunterSettings = {
      ...current.marketHunter,
      ...patch,
      platforms: {
        ...current.marketHunter.platforms,
        ...patch.platforms,
      },
      platformCategories: {
        ...current.marketHunter.platformCategories,
        ...patch.platformCategories,
      },
      llm: {
        ...current.marketHunter.llm,
        ...patch.llm,
      },
      costEstimates: {
        ...current.marketHunter.costEstimates,
        ...patch.costEstimates,
      },
    };
    await this.repo.setJson(SETTINGS_KEYS.marketHunter, next as unknown as Record<string, unknown>);
    this.snapshot = { ...current, marketHunter: next };
    return next;
  }

  getMarketHunterSettings(settings?: PlatformSettings): MarketHunterSettings {
    return (settings ?? this.getSync()).marketHunter;
  }
}

export const platformSettings = new SettingsService();
