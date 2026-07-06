import { BudgetGovernor } from '@agency/acquisition';
import { logger } from '@agency/config';
import { platformSettings } from '@agency/settings';
import { PlacesApiError, parsePlacesApiErrorBody } from './places-api-error';
import type { PlacesDetailsResult, PlacesTextSearchResponse } from './places-types';

const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const TEXT_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.addressComponents',
  'places.businessStatus',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'websiteUri',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'rating',
  'userRatingCount',
  'googleMapsUri',
  'reviews',
].join(',');

export class PlacesApiClient {
  private governor = new BudgetGovernor();
  private keyIndex = 0;

  async isConfigured(): Promise<boolean> {
    await platformSettings.ensureLoaded();
    return platformSettings.isPlacesConfigured();
  }

  private getApiKeys(): string[] {
    return platformSettings.getPlacesApiKeys();
  }

  private async fetchWithKeyRotation(
    url: string,
    init: RequestInit,
    context: string,
  ): Promise<Response | null> {
    const keys = this.getApiKeys();
    if (keys.length === 0) return null;

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const key = keys[(this.keyIndex + attempt) % keys.length];
      const res = await fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          'X-Goog-Api-Key': key,
        },
      });

      if (res.status === 429) {
        logger.warn('Places API rate limited (429), rotating key', {
          context,
          keyAttempt: attempt + 1,
          keyCount: keys.length,
        });
        continue;
      }

      if (res.ok) {
        this.keyIndex = (this.keyIndex + attempt) % keys.length;
        return res;
      }

      const errText = await res.text();
      const { message, reason } = parsePlacesApiErrorBody(errText);
      logger.warn('Places API request failed', {
        context,
        status: res.status,
        reason,
        err: message.slice(0, 200),
      });
      throw new PlacesApiError(res.status, message, reason);
    }

    throw new PlacesApiError(
      429,
      'Google Places API rate limited on all configured keys. Add another key or retry later.',
      'RATE_LIMITED',
    );
  }

  async textSearch(
    textQuery: string,
    regionCode: string | undefined,
    runId?: string,
    options?: { pageSize?: number; pageToken?: string },
  ): Promise<PlacesTextSearchResponse | null> {
    if (!(await this.governor.canSpend('google_places', 1))) {
      throw new Error(
        'Google Places monthly budget is exhausted. Run `pnpm db:reset-budget` or raise the Places cap in Settings, then retry.',
      );
    }

    const pageSize = Math.min(20, Math.max(1, options?.pageSize ?? 1));
    const body: Record<string, unknown> = {
      textQuery,
      pageSize,
      languageCode: 'en',
    };
    if (regionCode) body.regionCode = regionCode;
    if (options?.pageToken) body.pageToken = options.pageToken;

    const res = await this.fetchWithKeyRotation(
      TEXT_SEARCH_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-FieldMask': TEXT_FIELD_MASK,
        },
        body: JSON.stringify(body),
      },
      'text_search',
    );

    if (!res) return null;

    await this.governor.recordSpend({
      provider: 'google_places',
      operation: 'text_search',
      units: 1,
      runId,
    });

    return res.json() as Promise<PlacesTextSearchResponse>;
  }

  async placeDetails(placeId: string, runId?: string): Promise<PlacesDetailsResult | null> {
    if (!(await this.governor.canSpend('google_places', 1))) {
      throw new Error(
        'Google Places monthly budget is exhausted. Run `pnpm db:reset-budget` or raise the Places cap in Settings, then retry.',
      );
    }

    const normalizedId = placeId.startsWith('places/') ? placeId : `places/${placeId}`;
    const url = `https://places.googleapis.com/v1/${normalizedId}`;

    const res = await this.fetchWithKeyRotation(
      url,
      {
        method: 'GET',
        headers: {
          'X-Goog-FieldMask': DETAILS_FIELD_MASK,
        },
      },
      'place_details',
    );

    if (!res) return null;

    await this.governor.recordSpend({
      provider: 'google_places',
      operation: 'place_details',
      units: 1,
      runId,
    });

    return res.json() as Promise<PlacesDetailsResult>;
  }
}
