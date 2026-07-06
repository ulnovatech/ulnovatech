import { getDb, leadScores } from '@agency/database';
import { eq } from 'drizzle-orm';

export class QualificationRepository {
  async upsertScore(data: {
    businessId: string;
    score: number;
    reachability?: string;
    factors: Record<string, number>;
  }) {
    const db = getDb();
    const existing = await db
      .select()
      .from(leadScores)
      .where(eq(leadScores.businessId, data.businessId));

    if (existing[0]) {
      const [row] = await db
        .update(leadScores)
        .set({
          score: data.score,
          reachability: data.reachability,
          factors: data.factors,
          computedAt: new Date(),
        })
        .where(eq(leadScores.businessId, data.businessId))
        .returning();
      return row;
    }

    const [row] = await db.insert(leadScores).values(data).returning();
    return row;
  }

  async getScore(businessId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(leadScores)
      .where(eq(leadScores.businessId, businessId));
    return row ?? null;
  }
}
