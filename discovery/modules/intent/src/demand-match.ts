import { accounts, businesses, getDb } from '@agency/database';
import { desc, eq, ilike } from 'drizzle-orm';

function extractDomain(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

export async function matchBusinessForDemand(input: {
  sourceUrl?: string;
  title?: string;
  city?: string;
  country?: string;
  businessId?: string;
}): Promise<string | null> {
  if (input.businessId) return input.businessId;

  const db = getDb();

  if (input.sourceUrl) {
    const domain = extractDomain(input.sourceUrl);
    if (domain) {
      const byDomain = await db
        .select({ businessId: businesses.id })
        .from(businesses)
        .innerJoin(accounts, eq(businesses.accountId, accounts.id))
        .where(ilike(accounts.website, `%${domain}%`))
        .orderBy(desc(businesses.createdAt))
        .limit(1);
      if (byDomain[0]?.businessId) return byDomain[0].businessId;
    }
  }

  const title = input.title?.trim();
  if (title && title.length >= 4) {
    const byName = await db
      .select({ businessId: businesses.id })
      .from(businesses)
      .innerJoin(accounts, eq(businesses.accountId, accounts.id))
      .where(ilike(accounts.canonicalName, `%${title.slice(0, 40)}%`))
      .orderBy(desc(businesses.createdAt))
      .limit(1);
    if (byName[0]?.businessId) return byName[0].businessId;
  }

  return null;
}
