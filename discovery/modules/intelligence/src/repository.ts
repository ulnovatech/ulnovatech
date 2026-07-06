import { getDb, websiteAnalyses, businesses } from '@agency/database';
import { eq } from 'drizzle-orm';

export class IntelligenceRepository {
  async upsertAnalysis(data: {
    businessId: string;
    hasWebsite: boolean;
    mobileFriendly: boolean | null;
    httpsEnabled: boolean | null;
    performanceScore: number | null;
    notes: string | null;
  }) {
    const db = getDb();
    const existing = await db
      .select()
      .from(websiteAnalyses)
      .where(eq(websiteAnalyses.businessId, data.businessId));

    if (existing[0]) {
      const [row] = await db
        .update(websiteAnalyses)
        .set({ ...data, analyzedAt: new Date() })
        .where(eq(websiteAnalyses.businessId, data.businessId))
        .returning();
      return row;
    }

    const [row] = await db.insert(websiteAnalyses).values(data).returning();
    return row;
  }

  async getAnalysis(businessId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(websiteAnalyses)
      .where(eq(websiteAnalyses.businessId, businessId));
    return row ?? null;
  }

  async updateBusinessContact(
    businessId: string,
    data: { email?: string; phone?: string; website?: string },
  ) {
    const db = getDb();
    const [row] = await db
      .update(businesses)
      .set({
        ...(data.email && { email: data.email }),
        ...(data.phone && { phone: data.phone }),
        ...(data.website && { website: data.website }),
      })
      .where(eq(businesses.id, businessId))
      .returning();
    return row;
  }
}
