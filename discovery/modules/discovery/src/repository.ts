import {
  getDb,
  discoveryRuns,
  businesses,
  intentSignals,
  TEST_FIXTURE_COUNTRIES,
} from '@agency/database';
import { desc, eq, inArray, isNotNull, notInArray } from 'drizzle-orm';
import type { DiscoveredBusiness } from './providers/types';

export class DiscoveryRepository {
  async createRun(data: {
    country: string;
    city: string;
    industry: string;
    runProfile?: string;
    prospectFocus?: boolean;
    boiNarrative?: boolean;
  }) {
    const db = getDb();
    const [run] = await db
      .insert(discoveryRuns)
      .values({
        country: data.country,
        city: data.city,
        industry: data.industry,
        runProfile: data.runProfile ?? 'standard',
        prospectFocus: data.prospectFocus ?? false,
        boiNarrative: data.boiNarrative ?? false,
        status: 'pending',
      })
      .returning();
    return run;
  }

  async updateRunStatus(
    id: string,
    status: string,
    extra?: {
      startedAt?: Date;
      completedAt?: Date | null;
      errorMessage?: string | null;
    },
  ) {
    const db = getDb();
    const [run] = await db
      .update(discoveryRuns)
      .set({
        status,
        ...(extra?.startedAt && { startedAt: extra.startedAt }),
        ...(extra?.completedAt !== undefined && { completedAt: extra.completedAt }),
        ...(extra?.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
      })
      .where(eq(discoveryRuns.id, id))
      .returning();
    return run;
  }

  async updateRunStats(id: string, stats: Record<string, unknown>) {
    const db = getDb();
    const [run] = await db
      .update(discoveryRuns)
      .set({ stats })
      .where(eq(discoveryRuns.id, id))
      .returning();
    return run;
  }

  async listRuns() {
    const db = getDb();
    return db
      .select()
      .from(discoveryRuns)
      .where(notInArray(discoveryRuns.country, [...TEST_FIXTURE_COUNTRIES]))
      .orderBy(desc(discoveryRuns.createdAt));
  }

  async getRun(id: string) {
    const db = getDb();
    const [run] = await db.select().from(discoveryRuns).where(eq(discoveryRuns.id, id));
    return run ?? null;
  }

  async insertBusinesses(
    runId: string,
    items: Array<DiscoveredBusiness & { accountId: string }>,
  ) {
    if (items.length === 0) return [];
    const db = getDb();
    return db
      .insert(businesses)
      .values(
        items.map((b) => ({
          discoveryRunId: runId,
          accountId: b.accountId,
          name: b.name,
          industry: b.industry,
          website: b.website || null,
          phone: b.phone || null,
          email: b.email || null,
          city: b.city || null,
          country: b.country || null,
          source: b.source,
          sourceUrl: b.sourceUrl || null,
          externalId: b.externalId || null,
          googleMapsUrl: b.googleMapsUrl || null,
          facebookUrl: b.facebookUrl || null,
          instagramUrl: b.instagramUrl || null,
          rating: b.rating ?? null,
          reviewCount: b.reviewCount ?? null,
          metadata: b.metadata ?? null,
        })),
      )
      .returning();
  }

  async listBusinessesByRun(runId: string) {
    const db = getDb();
    return db.select().from(businesses).where(eq(businesses.discoveryRunId, runId));
  }

  async getBusiness(id: string) {
    const db = getDb();
    const [b] = await db.select().from(businesses).where(eq(businesses.id, id));
    return b ?? null;
  }

  async updateBusiness(
    id: string,
    data: Partial<{
      phone: string | null;
      website: string | null;
      rating: number | null;
      reviewCount: number | null;
      googleMapsUrl: string | null;
      metadata: Record<string, unknown> | null;
    }>,
  ) {
    const db = getDb();
    const [row] = await db.update(businesses).set(data).where(eq(businesses.id, id)).returning();
    return row ?? null;
  }

  /** Delete integration-test and legacy fixture runs only. */
  async purgeTestFixtureRuns(): Promise<{ runs: number; orphanSignals: number }> {
    const db = getDb();
    const fixtureRuns = await db
      .select({ id: discoveryRuns.id })
      .from(discoveryRuns)
      .where(inArray(discoveryRuns.country, [...TEST_FIXTURE_COUNTRIES]));
    const runIds = fixtureRuns.map((r) => r.id);
    if (runIds.length === 0) return { runs: 0, orphanSignals: 0 };

    const signalResult = await db
      .delete(intentSignals)
      .where(inArray(intentSignals.discoveryRunId, runIds))
      .returning({ id: intentSignals.id });
    const runResult = await db
      .delete(discoveryRuns)
      .where(inArray(discoveryRuns.id, runIds))
      .returning({ id: discoveryRuns.id });
    return { runs: runResult.length, orphanSignals: signalResult.length };
  }

  /** Delete all discovery runs (cascades businesses + acquisition_jobs). */
  async wipeAllRuns(): Promise<{ runs: number; orphanSignals: number }> {
    const db = getDb();
    const signalResult = await db
      .delete(intentSignals)
      .where(isNotNull(intentSignals.discoveryRunId))
      .returning({ id: intentSignals.id });
    const runResult = await db.delete(discoveryRuns).returning({ id: discoveryRuns.id });
    return { runs: runResult.length, orphanSignals: signalResult.length };
  }
}
