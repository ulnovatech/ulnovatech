import { getDb, intentSignals } from '@agency/database';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { SignalClass } from './types';

export class IntentRepository {
  async create(data: {
    businessId?: string;
    discoveryRunId?: string;
    source: string;
    signalType: string;
    signalClass?: SignalClass;
    signalStrength: number;
    title?: string;
    snippet?: string;
    sourceUrl?: string;
  }) {
    const db = getDb();
    const [signal] = await db
      .insert(intentSignals)
      .values({
        businessId: data.businessId,
        discoveryRunId: data.discoveryRunId,
        source: data.source,
        signalType: data.signalType,
        signalClass: data.signalClass ?? 'enrichment',
        signalStrength: data.signalStrength,
        title: data.title,
        snippet: data.snippet,
        sourceUrl: data.sourceUrl,
      })
      .returning();
    return signal;
  }

  async findById(id: string) {
    const db = getDb();
    const [row] = await db.select().from(intentSignals).where(eq(intentSignals.id, id)).limit(1);
    return row ?? null;
  }

  async findBySourceUrl(sourceUrl: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(intentSignals)
      .where(eq(intentSignals.sourceUrl, sourceUrl))
      .limit(1);
    return row ?? null;
  }

  async createDemandUnique(data: {
    businessId?: string;
    discoveryRunId?: string;
    source: string;
    signalType: string;
    signalStrength: number;
    title?: string;
    snippet?: string;
    sourceUrl: string;
  }) {
    const existing = await this.findBySourceUrl(data.sourceUrl);
    if (existing) return { signal: existing, created: false as const };
    const signal = await this.create({ ...data, signalClass: 'demand' });
    return { signal, created: true as const };
  }

  async listOrphanDemand({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const offset = (safePage - 1) * safeLimit;
    const db = getDb();

    const where = and(
      eq(intentSignals.signalClass, 'demand'),
      isNull(intentSignals.businessId),
      isNull(intentSignals.dismissedAt),
    );

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(intentSignals)
      .where(where);

    const rows = await db
      .select()
      .from(intentSignals)
      .where(where)
      .orderBy(desc(intentSignals.capturedAt))
      .limit(safeLimit)
      .offset(offset);

    return {
      items: rows,
      total: Number(countRow?.count ?? 0),
      page: safePage,
      limit: safeLimit,
    };
  }

  async dismissSignal(signalId: string) {
    const db = getDb();
    const [row] = await db
      .update(intentSignals)
      .set({ dismissedAt: new Date() })
      .where(eq(intentSignals.id, signalId))
      .returning();
    if (!row) throw new Error('Signal not found');
    return row;
  }

  async linkSignalToBusiness(signalId: string, businessId: string) {
    const db = getDb();
    const [row] = await db
      .update(intentSignals)
      .set({ businessId })
      .where(eq(intentSignals.id, signalId))
      .returning();
    if (!row) throw new Error('Signal not found');
    return row;
  }

  async listByBusiness(businessId: string) {
    const db = getDb();
    return db
      .select()
      .from(intentSignals)
      .where(eq(intentSignals.businessId, businessId))
      .orderBy(desc(intentSignals.capturedAt));
  }

  async listByRun(discoveryRunId: string) {
    const db = getDb();
    return db
      .select()
      .from(intentSignals)
      .where(eq(intentSignals.discoveryRunId, discoveryRunId))
      .orderBy(desc(intentSignals.capturedAt));
  }

  async maxStrengthForBusiness(businessId: string, signalClass?: SignalClass) {
    const db = getDb();
    const conditions = [eq(intentSignals.businessId, businessId)];
    if (signalClass) conditions.push(eq(intentSignals.signalClass, signalClass));

    const [row] = await db
      .select({ max: sql<number>`coalesce(max(${intentSignals.signalStrength}), 0)` })
      .from(intentSignals)
      .where(and(...conditions));
    return Number(row?.max ?? 0);
  }

  async countByClassForBusiness(businessId: string) {
    const signals = await this.listByBusiness(businessId);
    return {
      enrichment: signals.filter((s) => s.signalClass === 'enrichment').length,
      demand: signals.filter((s) => s.signalClass === 'demand').length,
    };
  }

  async strengthByClassForBusiness(businessId: string) {
    const [enrichment, demand] = await Promise.all([
      this.maxStrengthForBusiness(businessId, 'enrichment'),
      this.maxStrengthForBusiness(businessId, 'demand'),
    ]);
    return { enrichment, demand, combined: Math.max(enrichment, demand) };
  }
}
