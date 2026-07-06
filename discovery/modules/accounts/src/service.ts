import { platformSettings } from '@agency/settings';

import { extractBusinessDomain } from './domain';

import { buildNormalizedKey } from './normalize-key';

import { normalizePhoneDigits } from './phone';

import { AccountRepository, type AccountRow } from './repository';



/** Input shape aligned with discovery providers — avoids circular dependency on @agency/discovery */

export interface AccountResolveInput {

  name: string;

  source: string;

  industry?: string;

  website?: string;

  phone?: string;

  email?: string;

  city?: string;

  country?: string;

  sourceUrl?: string;

  externalId?: string;

  googleMapsUrl?: string;

  facebookUrl?: string;

  instagramUrl?: string;

  rating?: number;

  reviewCount?: number;

  metadata?: Record<string, unknown>;

}



export type AccountMatchKind = 'externalId' | 'phone' | 'domain' | 'normalizedKey';



export interface ResolveResult {

  account: AccountRow;

  created: boolean;

  skippedPlacesRefresh: boolean;

  matchedBy: AccountMatchKind;

}



export class AccountService {

  private repo = new AccountRepository();



  shouldRefreshPlaces(account: AccountRow, now = new Date()): boolean {

    if (!account.lastPlacesFetchAt) return true;

    const ttlMs = platformSettings.getPlacesTtlDays() * 24 * 60 * 60 * 1000;

    return now.getTime() - account.lastPlacesFetchAt.getTime() > ttlMs;

  }



  async isSuppressed(account: AccountRow): Promise<boolean> {

    if (account.suppressed) return true;

    return this.repo.matchesSuppressionList(account);

  }



  /**

   * Returns true when a google_maps candidate should skip a new Places API fetch (C4 will call this).

   */

  shouldSkipPlacesFetch(account: AccountRow): boolean {

    return account.source === 'google_maps' && !this.shouldRefreshPlaces(account);

  }



  private async findExistingAccount(

    input: AccountResolveInput,

    normalizedKey: string,

  ): Promise<{ account: AccountRow; matchedBy: AccountMatchKind } | null> {

    const externalId = input.externalId?.trim();

    if (externalId) {

      const byExternal = await this.repo.findBySourceExternalId(input.source, externalId);

      if (byExternal) return { account: byExternal, matchedBy: 'externalId' };

    }



    const phoneDigits = normalizePhoneDigits(input.phone);

    if (phoneDigits) {

      const byPhone = await this.repo.findByNormalizedPhone(phoneDigits);

      if (byPhone) return { account: byPhone, matchedBy: 'phone' };

    }



    const domain = extractBusinessDomain(input);

    if (domain) {

      const byDomain = await this.repo.findByDomain(domain);

      if (byDomain) return { account: byDomain, matchedBy: 'domain' };

    }



    const byKey = await this.repo.findByNormalizedKey(normalizedKey);

    if (byKey) return { account: byKey, matchedBy: 'normalizedKey' };



    return null;

  }



  async resolveOrCreate(input: AccountResolveInput): Promise<ResolveResult> {

    const normalizedKey = buildNormalizedKey({

      name: input.name,

      source: input.source,

      externalId: input.externalId,

      city: input.city,

      country: input.country,

    });



    const match = await this.findExistingAccount(input, normalizedKey);

    const existing = match?.account ?? null;

    const matchedBy = match?.matchedBy ?? 'normalizedKey';



    const isGoogleMaps = input.source === 'google_maps';

    const placesEnriched = !!(input.metadata?.placesVerified || input.metadata?.placesId);

    const now = new Date();



    if (existing) {

      const skippedPlacesRefresh =

        this.shouldSkipPlacesFetch(existing) ||

        (placesEnriched && !this.shouldRefreshPlaces(existing));

      const updated = await this.repo.update(existing.id, {

        canonicalName: input.name,

        website: input.website || existing.website,

        phone: input.phone || existing.phone,

        email: input.email || existing.email,

        city: input.city || existing.city,

        country: input.country || existing.country,

        industry: input.industry || existing.industry,

        sourceUrl: input.sourceUrl || existing.sourceUrl,

        googleMapsUrl: input.googleMapsUrl || existing.googleMapsUrl,

        facebookUrl: input.facebookUrl || existing.facebookUrl,

        instagramUrl: input.instagramUrl || existing.instagramUrl,

        rating: input.rating ?? existing.rating,

        reviewCount: input.reviewCount ?? existing.reviewCount,

        externalId: input.externalId?.trim() || existing.externalId,

        lastPlacesFetchAt:

          (isGoogleMaps || placesEnriched) && !skippedPlacesRefresh

            ? now

            : existing.lastPlacesFetchAt,

        metadata: placesEnriched

          ? { ...(existing.metadata as Record<string, unknown> | null), ...input.metadata }

          : (input.metadata ?? existing.metadata),

        lastEnrichedAt: now,

      });

      return {

        account: updated!,

        created: false,

        skippedPlacesRefresh,

        matchedBy,

      };

    }



    const created = await this.repo.create({

      canonicalName: input.name,

      normalizedKey,

      source: input.source,

      externalId: input.externalId?.trim() || null,

      website: input.website || null,

      phone: input.phone || null,

      email: input.email || null,

      city: input.city || null,

      country: input.country || null,

      industry: input.industry || null,

      sourceUrl: input.sourceUrl || null,

      googleMapsUrl: input.googleMapsUrl || null,

      facebookUrl: input.facebookUrl || null,

      instagramUrl: input.instagramUrl || null,

      rating: input.rating ?? null,

      reviewCount: input.reviewCount ?? null,

      metadata: input.metadata ?? null,

      lastPlacesFetchAt: isGoogleMaps || placesEnriched ? now : null,

    });



    return {

      account: created,

      created: true,

      skippedPlacesRefresh: false,

      matchedBy: 'normalizedKey',

    };

  }



  async suppress(accountId: string, reason?: string) {

    const existing = await this.repo.getById(accountId);

    return this.repo.update(accountId, {

      suppressed: true,

      metadata: {

        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),

        ...(reason ? { suppressReason: reason } : {}),

      },

    });

  }



  async snoozeReview(accountId: string, days = 30) {

    const until = new Date();

    until.setDate(until.getDate() + days);

    return this.repo.update(accountId, { reviewSnoozedUntil: until });

  }



  getById(id: string) {

    return this.repo.getById(id);

  }

}


