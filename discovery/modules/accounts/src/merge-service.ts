import {
  accountMergeLog,
  accounts,
  budgetLedger,
  businesses,
  getDb,
  leads,
} from '@agency/database';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { extractBusinessDomain } from './domain';
import { isSoftNameMatch, nameSimilarity } from './name-similarity';
import { normalizePhoneDigits } from './phone';
import { AccountRepository, type AccountRow } from './repository';

const ACTIVE_LEAD_STATUSES_BLOCKED = ['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'] as const;

export type DuplicateMatchKind = 'phone' | 'domain' | 'externalId' | 'nameCity';

export type DuplicateAccountSummary = {
  accountId: string;
  canonicalName: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source: string;
  businessCount: number;
  activeLeadStatus: string | null;
  matchKind: DuplicateMatchKind;
  score: number;
};

export type DuplicateGroup = {
  matchKind: DuplicateMatchKind;
  matchKey: string;
  score: number;
  accounts: DuplicateAccountSummary[];
};

export class AccountMergeError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'SAME_ACCOUNT' | 'ACTIVE_LEAD_CONFLICT',
  ) {
    super(message);
    this.name = 'AccountMergeError';
  }
}

export class AccountMergeService {
  private repo = new AccountRepository();

  async findDuplicateCandidates(accountId: string): Promise<DuplicateAccountSummary[]> {
    const account = await this.repo.getById(accountId);
    if (!account) throw new AccountMergeError('Account not found', 'NOT_FOUND');

    const found = new Map<string, { kind: DuplicateMatchKind; score: number }>();

    const phoneDigits = normalizePhoneDigits(account.phone);
    if (phoneDigits) {
      const match = await this.repo.findByNormalizedPhone(phoneDigits);
      if (match && match.id !== accountId) {
        found.set(match.id, { kind: 'phone', score: 1 });
      }
    }

    const domain = extractBusinessDomain(account);
    if (domain) {
      const match = await this.repo.findByDomain(domain);
      if (match && match.id !== accountId) {
        found.set(match.id, { kind: 'domain', score: 1 });
      }
    }

    if (account.externalId?.trim()) {
      const db = getDb();
      const rows = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.source, account.source),
            eq(accounts.externalId, account.externalId.trim()),
          ),
        );
      for (const row of rows) {
        if (row.id !== accountId) {
          found.set(row.id, { kind: 'externalId', score: 1 });
        }
      }
    }

    if (account.city?.trim()) {
      const city = account.city.trim();
      const db = getDb();
      const peers = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.city, city), sql`${accounts.id} != ${accountId}`))
        .limit(200);

      for (const peer of peers) {
        const score = nameSimilarity(account.canonicalName, peer.canonicalName);
        if (isSoftNameMatch(account.canonicalName, peer.canonicalName)) {
          const existing = found.get(peer.id);
          if (!existing || score > existing.score) {
            found.set(peer.id, { kind: 'nameCity', score });
          }
        }
      }
    }

    const summaries = await this.summarizeAccounts(
      [...found.entries()].map(([id, meta]) => ({ id, ...meta })),
    );
    return summaries.sort((a, b) => b.score - a.score);
  }

  async scanDuplicateGroups(limit = 50): Promise<DuplicateGroup[]> {
    const db = getDb();
    const groups: DuplicateGroup[] = [];

    const phoneRows = await db.execute<{ digits: string; account_ids: string[] }>(sql`
      SELECT
        regexp_replace(phone, '[^0-9]', '', 'g') AS digits,
        array_agg(id ORDER BY created_at) AS account_ids
      FROM accounts
      WHERE phone IS NOT NULL
        AND length(regexp_replace(phone, '[^0-9]', '', 'g')) >= 7
      GROUP BY digits
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
      LIMIT ${Math.min(limit, 25)}
    `);

    for (const row of phoneRows) {
      const ids = row.account_ids ?? [];
      if (ids.length < 2) continue;
      const accountsInGroup = await this.summarizeAccounts(
        ids.map((id) => ({ id, kind: 'phone' as const, score: 1 })),
      );
      groups.push({
        matchKind: 'phone',
        matchKey: row.digits,
        score: 1,
        accounts: accountsInGroup,
      });
    }

    const domainRows = await db.execute<{ domain: string; account_ids: string[] }>(sql`
      WITH hosts AS (
        SELECT
          id,
          lower(
            regexp_replace(
              split_part(regexp_replace(coalesce(website, ''), '^https?://', ''), '/', 1),
              '^www\\.',
              ''
            )
          ) AS host
        FROM accounts
        WHERE coalesce(website, '') != ''
        UNION ALL
        SELECT id, lower(split_part(coalesce(email, ''), '@', 2)) AS host
        FROM accounts
        WHERE coalesce(email, '') LIKE '%@%'
      )
      SELECT host AS domain, array_agg(DISTINCT id ORDER BY id) AS account_ids
      FROM hosts
      WHERE host != ''
        AND host NOT IN (
          'gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
          'facebook.com', 'instagram.com', 'linktr.ee'
        )
      GROUP BY host
      HAVING COUNT(DISTINCT id) > 1
      ORDER BY COUNT(DISTINCT id) DESC
      LIMIT ${Math.min(limit, 25)}
    `);

    for (const row of domainRows) {
      const ids = row.account_ids ?? [];
      if (ids.length < 2) continue;
      const accountsInGroup = await this.summarizeAccounts(
        ids.map((id) => ({ id, kind: 'domain' as const, score: 1 })),
      );
      groups.push({
        matchKind: 'domain',
        matchKey: row.domain,
        score: 1,
        accounts: accountsInGroup,
      });
    }

    return groups
      .sort((a, b) => b.accounts.length - a.accounts.length)
      .slice(0, limit);
  }

  async mergeAccounts(
    survivorId: string,
    mergedId: string,
    operatorId?: string,
    matchKinds?: DuplicateMatchKind[],
  ): Promise<AccountRow> {
    if (survivorId === mergedId) {
      throw new AccountMergeError('Cannot merge an account into itself', 'SAME_ACCOUNT');
    }

    const survivor = await this.repo.getById(survivorId);
    const merged = await this.repo.getById(mergedId);
    if (!survivor || !merged) {
      throw new AccountMergeError('Account not found', 'NOT_FOUND');
    }

    const db = getDb();
    const survivorActive = await this.getActiveLeadStatus(survivorId);
    const mergedActive = await this.getActiveLeadStatus(mergedId);
    if (survivorActive && mergedActive) {
      throw new AccountMergeError(
        'Both accounts have an active lead — close or merge leads manually first',
        'ACTIVE_LEAD_CONFLICT',
      );
    }

    const mergedFields = this.mergeScalarFields(survivor, merged);

    await db.transaction(async (tx) => {
      await tx
        .update(businesses)
        .set({ accountId: survivorId })
        .where(eq(businesses.accountId, mergedId));

      await tx.update(leads).set({ accountId: survivorId }).where(eq(leads.accountId, mergedId));

      await tx
        .update(budgetLedger)
        .set({ accountId: survivorId })
        .where(eq(budgetLedger.accountId, mergedId));

      await tx
        .update(accounts)
        .set({ ...mergedFields, updatedAt: new Date() })
        .where(eq(accounts.id, survivorId));

      await tx.insert(accountMergeLog).values({
        survivorId,
        mergedId,
        mergedNormalizedKey: merged.normalizedKey,
        operatorId: operatorId ?? null,
        matchKinds: matchKinds ?? null,
      });

      await tx.delete(accounts).where(eq(accounts.id, mergedId));
    });

    const updated = await this.repo.getById(survivorId);
    if (!updated) throw new AccountMergeError('Survivor account missing after merge', 'NOT_FOUND');
    return updated;
  }

  private async getActiveLeadStatus(accountId: string): Promise<string | null> {
    const db = getDb();
    const [row] = await db
      .select({ status: leads.status })
      .from(leads)
      .where(
        and(
          eq(leads.accountId, accountId),
          notInArray(leads.status, [...ACTIVE_LEAD_STATUSES_BLOCKED]),
        ),
      )
      .limit(1);
    return row?.status ?? null;
  }

  private mergeScalarFields(survivor: AccountRow, merged: AccountRow) {
    const pick = <T>(survivorVal: T | null, mergedVal: T | null): T | null => {
      if (mergedVal != null && mergedVal !== '' && survivorVal == null) return mergedVal;
      if (
        mergedVal != null &&
        mergedVal !== '' &&
        survivorVal != null &&
        merged.updatedAt > survivor.updatedAt
      ) {
        return mergedVal;
      }
      return survivorVal ?? mergedVal ?? null;
    };

    return {
      canonicalName: survivor.canonicalName,
      website: pick(survivor.website, merged.website),
      phone: pick(survivor.phone, merged.phone),
      email: pick(survivor.email, merged.email),
      city: pick(survivor.city, merged.city),
      country: pick(survivor.country, merged.country),
      industry: pick(survivor.industry, merged.industry),
      sourceUrl: pick(survivor.sourceUrl, merged.sourceUrl),
      googleMapsUrl: pick(survivor.googleMapsUrl, merged.googleMapsUrl),
      facebookUrl: pick(survivor.facebookUrl, merged.facebookUrl),
      instagramUrl: pick(survivor.instagramUrl, merged.instagramUrl),
      rating: survivor.rating ?? merged.rating,
      reviewCount: survivor.reviewCount ?? merged.reviewCount,
      externalId: survivor.externalId ?? merged.externalId,
      metadata: {
        ...((merged.metadata as Record<string, unknown> | null) ?? {}),
        ...((survivor.metadata as Record<string, unknown> | null) ?? {}),
        mergedFrom: merged.id,
        mergedAt: new Date().toISOString(),
      },
      suppressed: survivor.suppressed || merged.suppressed,
      reviewSnoozedUntil:
        survivor.reviewSnoozedUntil && merged.reviewSnoozedUntil
          ? survivor.reviewSnoozedUntil > merged.reviewSnoozedUntil
            ? survivor.reviewSnoozedUntil
            : merged.reviewSnoozedUntil
          : survivor.reviewSnoozedUntil ?? merged.reviewSnoozedUntil,
      lastEnrichedAt:
        survivor.lastEnrichedAt && merged.lastEnrichedAt
          ? survivor.lastEnrichedAt > merged.lastEnrichedAt
            ? survivor.lastEnrichedAt
            : merged.lastEnrichedAt
          : survivor.lastEnrichedAt ?? merged.lastEnrichedAt,
      lastPlacesFetchAt:
        survivor.lastPlacesFetchAt && merged.lastPlacesFetchAt
          ? survivor.lastPlacesFetchAt > merged.lastPlacesFetchAt
            ? survivor.lastPlacesFetchAt
            : merged.lastPlacesFetchAt
          : survivor.lastPlacesFetchAt ?? merged.lastPlacesFetchAt,
      lastCrawledAt:
        survivor.lastCrawledAt && merged.lastCrawledAt
          ? survivor.lastCrawledAt > merged.lastCrawledAt
            ? survivor.lastCrawledAt
            : merged.lastCrawledAt
          : survivor.lastCrawledAt ?? merged.lastCrawledAt,
      crawlStatus: survivor.crawlStatus ?? merged.crawlStatus,
    };
  }

  private async summarizeAccounts(
    items: { id: string; kind: DuplicateMatchKind; score: number }[],
  ): Promise<DuplicateAccountSummary[]> {
    if (items.length === 0) return [];

    const db = getDb();
    const ids = items.map((item) => item.id);
    const accountRows = await db.select().from(accounts).where(inArray(accounts.id, ids));
    const accountMap = new Map(accountRows.map((row) => [row.id, row]));

    const businessCounts = await db
      .select({
        accountId: businesses.accountId,
        count: sql<number>`count(*)::int`,
      })
      .from(businesses)
      .where(inArray(businesses.accountId, ids))
      .groupBy(businesses.accountId);

    const countMap = new Map(
      businessCounts.map((row) => [row.accountId, row.count]),
    );

    const summaries: DuplicateAccountSummary[] = [];
    for (const item of items) {
      const account = accountMap.get(item.id);
      if (!account) continue;
      summaries.push({
        accountId: account.id,
        canonicalName: account.canonicalName,
        city: account.city,
        country: account.country,
        phone: account.phone,
        email: account.email,
        website: account.website,
        source: account.source,
        businessCount: countMap.get(account.id) ?? 0,
        activeLeadStatus: await this.getActiveLeadStatus(account.id),
        matchKind: item.kind,
        score: item.score,
      });
    }

    return summaries;
  }
}
