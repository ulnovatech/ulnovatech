import { accounts, getDb, suppressionList } from '@agency/database';
import { and, desc, eq, isNotNull, or, sql } from 'drizzle-orm';
import { extractBusinessDomain } from './domain';
import { buildNormalizedKey, type NormalizeInput } from './normalize-key';
import { MIN_PHONE_DIGITS, normalizePhoneDigits } from './phone';

export type AccountRow = typeof accounts.$inferSelect;

export class AccountRepository {
  async findByNormalizedKey(key: string) {
    const db = getDb();
    const [row] = await db.select().from(accounts).where(eq(accounts.normalizedKey, key));
    return row ?? null;
  }

  async findBySourceExternalId(source: string, externalId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.source, source), eq(accounts.externalId, externalId)));
    return row ?? null;
  }

  async findByNormalizedPhone(digits: string) {
    if (digits.length < MIN_PHONE_DIGITS) return null;
    const db = getDb();
    const [row] = await db
      .select()
      .from(accounts)
      .where(
        and(
          isNotNull(accounts.phone),
          sql`regexp_replace(${accounts.phone}, '[^0-9]', '', 'g') = ${digits}`,
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findByDomain(domain: string) {
    const normalized = domain.trim().toLowerCase().replace(/^www\./, '');
    if (!normalized) return null;

    const db = getDb();
    const [row] = await db
      .select()
      .from(accounts)
      .where(
        or(
          sql`lower(
            regexp_replace(
              split_part(regexp_replace(coalesce(${accounts.website}, ''), '^https?://', ''), '/', 1),
              '^www\\.',
              ''
            )
          ) = ${normalized}`,
          sql`lower(split_part(coalesce(${accounts.email}, ''), '@', 2)) = ${normalized}`,
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async findByPlacesExternalId(placesId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(accounts)
      .where(
        or(
          and(eq(accounts.source, 'google_maps'), eq(accounts.externalId, placesId)),
          sql`${accounts.metadata}->>'placesId' = ${placesId}`,
        ),
      )
      .limit(1);
    return row ?? null;
  }

  async create(data: {
    canonicalName: string;
    normalizedKey: string;
    source: string;
    externalId?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    country?: string | null;
    industry?: string | null;
    sourceUrl?: string | null;
    googleMapsUrl?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    metadata?: Record<string, unknown> | null;
    lastPlacesFetchAt?: Date | null;
  }) {
    const db = getDb();
    const [row] = await db
      .insert(accounts)
      .values({
        canonicalName: data.canonicalName,
        normalizedKey: data.normalizedKey,
        source: data.source,
        externalId: data.externalId ?? null,
        website: data.website ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        city: data.city ?? null,
        country: data.country ?? null,
        industry: data.industry ?? null,
        sourceUrl: data.sourceUrl ?? null,
        googleMapsUrl: data.googleMapsUrl ?? null,
        facebookUrl: data.facebookUrl ?? null,
        instagramUrl: data.instagramUrl ?? null,
        rating: data.rating ?? null,
        reviewCount: data.reviewCount ?? null,
        metadata: data.metadata ?? null,
        lastPlacesFetchAt: data.lastPlacesFetchAt ?? null,
      })
      .returning();
    return row;
  }

  async update(id: string, data: Partial<Omit<AccountRow, 'id' | 'createdAt'>>) {
    const db = getDb();
    const [row] = await db
      .update(accounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return row ?? null;
  }

  async getById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(accounts).where(eq(accounts.id, id));
    return row ?? null;
  }

  async listSuppressionEntries(limit = 200) {
    const db = getDb();
    return db
      .select()
      .from(suppressionList)
      .orderBy(desc(suppressionList.createdAt))
      .limit(limit);
  }

  async findSuppressionEntry(data: {
    email?: string | null;
    phone?: string | null;
    domain?: string | null;
  }) {
    const db = getDb();
    const conditions = [];
    if (data.email) conditions.push(eq(suppressionList.email, data.email));
    if (data.phone) conditions.push(eq(suppressionList.phone, data.phone));
    if (data.domain) conditions.push(eq(suppressionList.domain, data.domain));
    if (conditions.length === 0) return null;

    const [row] = await db
      .select()
      .from(suppressionList)
      .where(or(...conditions))
      .limit(1);
    return row ?? null;
  }

  async addSuppressionEntry(data: {
    email?: string | null;
    phone?: string | null;
    domain?: string | null;
    reason?: string | null;
  }) {
    const db = getDb();
    const [row] = await db
      .insert(suppressionList)
      .values({
        email: data.email ?? null,
        phone: data.phone ?? null,
        domain: data.domain ?? null,
        reason: data.reason ?? null,
      })
      .returning();
    return row;
  }

  async deleteSuppressionEntry(id: string) {
    const db = getDb();
    const [row] = await db
      .delete(suppressionList)
      .where(eq(suppressionList.id, id))
      .returning({ id: suppressionList.id });
    return row ?? null;
  }

  async matchesSuppressionList(account: AccountRow): Promise<boolean> {
    const db = getDb();
    const domain = extractBusinessDomain({
      website: account.website,
      email: account.email,
    });
    const phoneDigits = normalizePhoneDigits(account.phone);

    const conditions = [];
    if (account.email) {
      conditions.push(eq(suppressionList.email, account.email.toLowerCase()));
    }
    if (phoneDigits) {
      conditions.push(
        sql`regexp_replace(${suppressionList.phone}, '[^0-9]', '', 'g') = ${phoneDigits}`,
      );
    }
    if (domain) {
      conditions.push(eq(suppressionList.domain, domain));
    }

    if (conditions.length === 0) return false;

    const [row] = await db
      .select({ id: suppressionList.id })
      .from(suppressionList)
      .where(or(...conditions))
      .limit(1);
    return !!row;
  }

  buildKeyFromInput(input: NormalizeInput) {
    return buildNormalizedKey(input);
  }
}
