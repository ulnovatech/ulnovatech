import { BudgetGovernor } from '@agency/acquisition';
import { logger } from '@agency/config';
import { countryToIso2 } from '@agency/geo';
import { platformSettings } from '@agency/settings';
import type { SearchResultItem } from './parse-search-results';
import {
  parseBingSearchErrorBody,
  parseGoogleSearchErrorBody,
  SearchApiError,
} from './search-api-error';

const CSE_URL = 'https://www.googleapis.com/customsearch/v1';
const BING_URL = 'https://api.bing.microsoft.com/v7.0/search';
export const SEARCH_RESULTS_PER_PAGE = 10;

export type SearchEngineOperation = 'search' | 'social_search';

export type SearchApiCallError = {
  engine: 'google_cse' | 'bing_search';
  query: string;
  status: number;
  message: string;
};

export type SearchQueryResult = {
  items: SearchResultItem[];
  cseCalls: number;
  bingCalls: number;
  budgetExhausted: boolean;
  errors: SearchApiCallError[];
};

/** Normalize URL for deduplication across CSE and Bing results. */
export function normalizeSearchUrl(link: string): string {
  try {
    const u = new URL(link.trim());
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    const path = u.pathname.replace(/\/+$/, '') || '';
    return `${u.protocol}//${u.hostname}${path}${u.search}`;
  } catch {
    return link.trim().toLowerCase();
  }
}

/** Merge search hits from multiple engines, deduping by normalized URL (CSE first). */
export function mergeSearchResults(...lists: SearchResultItem[][]): SearchResultItem[] {
  const seen = new Set<string>();
  const merged: SearchResultItem[] = [];

  for (const list of lists) {
    for (const item of list) {
      const link = item.link?.trim();
      if (!link) continue;
      const key = normalizeSearchUrl(link);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

function bingMarketForCountry(iso2: string | undefined): { mkt: string; cc?: string } {
  if (!iso2) return { mkt: 'en-US' };
  const lower = iso2.toLowerCase();
  const regional = `en-${iso2}`;
  const knownRegional = new Set([
    'en-US',
    'en-GB',
    'en-AU',
    'en-CA',
    'en-IN',
    'en-NZ',
    'fr-FR',
    'de-DE',
    'es-ES',
    'it-IT',
    'pt-BR',
    'ja-JP',
    'ko-KR',
  ]);
  if (knownRegional.has(regional)) {
    return { mkt: regional, cc: lower };
  }
  return { mkt: 'en-US', cc: lower };
}

export class SearchApiClient {
  private governor = new BudgetGovernor();

  constructor(
    private readonly options: {
      cseOperation?: SearchEngineOperation;
      bingOperation?: SearchEngineOperation;
      logContext?: string;
    } = {},
  ) {}

  private get logContext(): string {
    return this.options.logContext ?? 'search';
  }

  hasCse(): boolean {
    return !!(
      platformSettings.getCredential('google_cse_api_key') &&
      platformSettings.getCredential('google_cse_cx')
    );
  }

  hasBing(): boolean {
    return !!platformSettings.getCredential('bing_search_key');
  }

  isConfigured(): boolean {
    return this.hasCse() || this.hasBing();
  }

  async searchQuery(
    query: string,
    opts: { maxPages: number; country: string },
  ): Promise<SearchQueryResult> {
    const iso2 = countryToIso2(opts.country);
    const errors: SearchApiCallError[] = [];
    let cseItems: SearchResultItem[] = [];
    let bingItems: SearchResultItem[] = [];
    let cseCalls = 0;
    let bingCalls = 0;
    let budgetExhausted = false;

    if (this.hasCse()) {
      const cse = await this.fetchCsePages(query, opts.maxPages, iso2);
      cseItems = cse.items;
      cseCalls = cse.apiCalls;
      budgetExhausted = budgetExhausted || cse.budgetExhausted;
      errors.push(...cse.errors);
    }

    if (this.hasBing()) {
      const bing = await this.fetchBingPages(query, opts.maxPages, iso2);
      bingItems = bing.items;
      bingCalls = bing.apiCalls;
      budgetExhausted = budgetExhausted || bing.budgetExhausted;
      errors.push(...bing.errors);
    }

    const items = mergeSearchResults(cseItems, bingItems);

    if (items.length === 0 && errors.length > 0 && this.isConfigured()) {
      const hard = errors.find((e) => e.status === 401 || e.status === 403);
      if (hard) {
        throw new SearchApiError(hard.engine, hard.status, hard.message);
      }
    }

    return { items, cseCalls, bingCalls, budgetExhausted, errors };
  }

  private async fetchCsePages(
    query: string,
    maxPages: number,
    iso2: string | undefined,
  ): Promise<{
    items: SearchResultItem[];
    apiCalls: number;
    budgetExhausted: boolean;
    errors: SearchApiCallError[];
  }> {
    const items: SearchResultItem[] = [];
    const errors: SearchApiCallError[] = [];
    let apiCalls = 0;
    let budgetExhausted = false;

    for (let page = 0; page < maxPages; page++) {
      if (!(await this.governor.canSpend('google_cse', 1))) {
        logger.info('Google CSE daily budget exhausted', { context: this.logContext });
        budgetExhausted = true;
        break;
      }

      const start = page * SEARCH_RESULTS_PER_PAGE + 1;
      const pageResult = await this.fetchCsePage(query, start, iso2);
      apiCalls++;

      if (pageResult.error) {
        errors.push({ ...pageResult.error, query });
        break;
      }

      if (pageResult.items.length === 0) break;
      items.push(...pageResult.items);
      if (pageResult.items.length < SEARCH_RESULTS_PER_PAGE) break;
    }

    return { items, apiCalls, budgetExhausted, errors };
  }

  private async fetchCsePage(
    query: string,
    start: number,
    iso2: string | undefined,
  ): Promise<{
    items: SearchResultItem[];
    error?: Omit<SearchApiCallError, 'query'>;
  }> {
    const key = platformSettings.getCredential('google_cse_api_key')!;
    const cx = platformSettings.getCredential('google_cse_cx')!;
    const params = new URLSearchParams({
      key,
      cx,
      q: query,
      num: String(SEARCH_RESULTS_PER_PAGE),
      start: String(start),
    });
    if (iso2) {
      params.set('gl', iso2);
      params.set('cr', `country${iso2}`);
    }

    const res = await fetch(`${CSE_URL}?${params.toString()}`);
    if (!res.ok) {
      const errText = await res.text();
      const { message, reason } = parseGoogleSearchErrorBody(errText);
      logger.warn('Google CSE request failed', {
        context: this.logContext,
        status: res.status,
        reason,
        err: message.slice(0, 200),
      });
      return {
        items: [],
        error: { engine: 'google_cse', status: res.status, message },
      };
    }

    await this.governor.recordSpend({
      provider: 'google_cse',
      operation: this.options.cseOperation ?? 'search',
      units: 1,
    });

    const data = (await res.json()) as {
      items?: Array<{ title?: string; link?: string; snippet?: string }>;
    };

    return {
      items: (data.items ?? []).map((i) => ({
        title: i.title ?? '',
        link: i.link ?? '',
        snippet: i.snippet,
      })),
    };
  }

  private async fetchBingPages(
    query: string,
    maxPages: number,
    iso2: string | undefined,
  ): Promise<{
    items: SearchResultItem[];
    apiCalls: number;
    budgetExhausted: boolean;
    errors: SearchApiCallError[];
  }> {
    const items: SearchResultItem[] = [];
    const errors: SearchApiCallError[] = [];
    let apiCalls = 0;
    let budgetExhausted = false;
    const { mkt, cc } = bingMarketForCountry(iso2);

    for (let page = 0; page < maxPages; page++) {
      if (!(await this.governor.canSpend('bing_search', 1))) {
        logger.info('Bing Search daily budget exhausted', { context: this.logContext });
        budgetExhausted = true;
        break;
      }

      const offset = page * SEARCH_RESULTS_PER_PAGE;
      const pageResult = await this.fetchBingPage(query, offset, mkt, cc);
      apiCalls++;

      if (pageResult.error) {
        errors.push({ ...pageResult.error, query });
        break;
      }

      if (pageResult.items.length === 0) break;
      items.push(...pageResult.items);
      if (pageResult.items.length < SEARCH_RESULTS_PER_PAGE) break;
    }

    return { items, apiCalls, budgetExhausted, errors };
  }

  private async fetchBingPage(
    query: string,
    offset: number,
    mkt: string,
    cc?: string,
  ): Promise<{
    items: SearchResultItem[];
    error?: Omit<SearchApiCallError, 'query'>;
  }> {
    const params = new URLSearchParams({
      q: query,
      count: String(SEARCH_RESULTS_PER_PAGE),
      offset: String(offset),
      mkt,
    });
    if (cc) params.set('cc', cc);

    const res = await fetch(`${BING_URL}?${params.toString()}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': platformSettings.getCredential('bing_search_key')!,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      const { message, reason } = parseBingSearchErrorBody(errText);
      logger.warn('Bing Search request failed', {
        context: this.logContext,
        status: res.status,
        reason,
        err: message.slice(0, 200),
      });
      return {
        items: [],
        error: { engine: 'bing_search', status: res.status, message },
      };
    }

    await this.governor.recordSpend({
      provider: 'bing_search',
      operation: this.options.bingOperation ?? 'search',
      units: 1,
    });

    const data = (await res.json()) as {
      webPages?: { value?: Array<{ name?: string; url?: string; snippet?: string }> };
    };

    return {
      items: (data.webPages?.value ?? []).map((i) => ({
        title: i.name ?? '',
        link: i.url ?? '',
        snippet: i.snippet,
      })),
    };
  }
}
