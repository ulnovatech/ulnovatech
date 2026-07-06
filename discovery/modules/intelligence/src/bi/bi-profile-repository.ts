import { businessIntelligenceProfiles, getDb } from '@agency/database';
import { eq } from 'drizzle-orm';
import type { BusinessIntelligenceProfile } from './types';

export class BiProfileRepository {
  async upsert(data: {
    accountId: string;
    businessId: string;
    discoveryRunId?: string;
    profile: BusinessIntelligenceProfile;
    completenessScore: number;
  }) {
    const db = getDb();
    const now = new Date();
    const [existing] = await db
      .select()
      .from(businessIntelligenceProfiles)
      .where(eq(businessIntelligenceProfiles.accountId, data.accountId));

    if (existing) {
      const [row] = await db
        .update(businessIntelligenceProfiles)
        .set({
          businessId: data.businessId,
          discoveryRunId: data.discoveryRunId ?? existing.discoveryRunId,
          profile: data.profile as unknown as Record<string, unknown>,
          completenessScore: data.completenessScore,
          enrichedAt: now,
          updatedAt: now,
        })
        .where(eq(businessIntelligenceProfiles.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await db
      .insert(businessIntelligenceProfiles)
      .values({
        accountId: data.accountId,
        businessId: data.businessId,
        discoveryRunId: data.discoveryRunId,
        profile: data.profile as unknown as Record<string, unknown>,
        completenessScore: data.completenessScore,
        enrichedAt: now,
        updatedAt: now,
      })
      .returning();
    return row;
  }

  async getByAccountId(accountId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(businessIntelligenceProfiles)
      .where(eq(businessIntelligenceProfiles.accountId, accountId));
    return row ?? null;
  }

  async getByBusinessId(businessId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(businessIntelligenceProfiles)
      .where(eq(businessIntelligenceProfiles.businessId, businessId));
    return row ?? null;
  }
}
