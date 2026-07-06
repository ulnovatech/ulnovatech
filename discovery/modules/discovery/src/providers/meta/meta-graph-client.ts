import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import type {
  MetaGraphErrorBody,
  MetaGraphPageResult,
  MetaGraphPlaceResult,
  MetaGraphSearchResponse,
  MetaGraphSearchType,
} from './meta-graph-types';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const PAGE_FIELDS =
  'id,name,link,location,phone,website,category,fan_count,instagram_business_account{id,username,name,website}';
const PLACE_FIELDS = 'id,name,link,location,phone,website,category';

export class MetaGraphApiError extends Error {
  readonly code?: number;
  readonly errorType?: string;
  readonly isRateLimit: boolean;
  readonly isAuthError: boolean;

  constructor(body: MetaGraphErrorBody) {
    super(body.message);
    this.name = 'MetaGraphApiError';
    this.code = body.code;
    this.errorType = body.type;
    this.isRateLimit = isRateLimitCode(body.code);
    this.isAuthError = isAuthErrorCode(body.code, body.type);
  }
}

function isRateLimitCode(code?: number): boolean {
  return code === 4 || code === 17 || code === 32 || code === 613;
}

function isAuthErrorCode(code?: number, type?: string): boolean {
  if (type === 'OAuthException') return true;
  return code === 190 || code === 102 || code === 200;
}

export type MetaGraphSearchOptions = {
  limit?: number;
  after?: string;
};

export class MetaGraphClient {
  getAccessToken(): string | undefined {
    return platformSettings.getCredential('meta_graph_api_token');
  }

  isConfigured(): boolean {
    return !!this.getAccessToken();
  }

  async searchPages(
    query: string,
    options: MetaGraphSearchOptions = {},
  ): Promise<MetaGraphSearchResponse<MetaGraphPageResult>> {
    return this.search('page', query, PAGE_FIELDS, options);
  }

  async searchPlaces(
    query: string,
    options: MetaGraphSearchOptions = {},
  ): Promise<MetaGraphSearchResponse<MetaGraphPlaceResult>> {
    return this.search('place', query, PLACE_FIELDS, options);
  }

  private async search<T>(
    type: MetaGraphSearchType,
    query: string,
    fields: string,
    options: MetaGraphSearchOptions,
  ): Promise<MetaGraphSearchResponse<T>> {
    const token = this.getAccessToken();
    if (!token) {
      return { data: [] };
    }

    const params = new URLSearchParams({
      type,
      q: query,
      fields,
      limit: String(Math.min(25, Math.max(1, options.limit ?? 25))),
      access_token: token,
    });
    if (options.after) params.set('after', options.after);

    const url = `${GRAPH_BASE}/search?${params.toString()}`;
    const res = await fetch(url);
    const body = (await res.json()) as MetaGraphSearchResponse<T>;

    if (!res.ok || body.error) {
      const err = body.error ?? {
        message: `Meta Graph HTTP ${res.status}`,
        code: res.status,
      };
      logger.warn('Meta Graph search failed', {
        type,
        query,
        status: res.status,
        code: err.code,
        message: err.message.slice(0, 200),
      });
      throw new MetaGraphApiError(err);
    }

    return body;
  }
}
