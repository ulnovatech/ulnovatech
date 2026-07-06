import { getDb, mhActionCards, mhListings, mhScanJobs, mhScans, mhSpendLedger } from '@agency/database';
import { and, desc, eq, lt, sql } from 'drizzle-orm';
import type { MhSpendProvider } from './types';
import type { MarketplaceListing } from './platforms/base.adapter';
import { listingKey } from './platforms/base.adapter';
import type { ActionCard } from './output/action-card';
import type { MhActionCardStatus, MhScanStatus } from './types';

export class MarketHunterRepository {
  async createScan() {
    const db = getDb();
    const [row] = await db
      .insert(mhScans)
      .values({ status: 'pending' })
      .returning();
    return row;
  }

  async getScan(id: string) {
    const db = getDb();
    const [row] = await db.select().from(mhScans).where(eq(mhScans.id, id));
    return row ?? null;
  }

  async listScans(limit = 50) {
    const db = getDb();
    return db.select().from(mhScans).orderBy(desc(mhScans.createdAt)).limit(limit);
  }

  async updateScanStatus(
    id: string,
    status: MhScanStatus,
    extra?: {
      startedAt?: Date;
      completedAt?: Date | null;
      errorMessage?: string | null;
      stats?: Record<string, unknown>;
    },
  ) {
    const db = getDb();
    const [row] = await db
      .update(mhScans)
      .set({
        status,
        ...(extra?.startedAt !== undefined && { startedAt: extra.startedAt }),
        ...(extra?.completedAt !== undefined && { completedAt: extra.completedAt }),
        ...(extra?.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
        ...(extra?.stats !== undefined && { stats: extra.stats }),
      })
      .where(eq(mhScans.id, id))
      .returning();
    return row ?? null;
  }

  async countScans() {
    const db = getDb();
    const rows = await db.select({ id: mhScans.id }).from(mhScans);
    return rows.length;
  }

  async saveListing(
    scanId: string,
    listing: MarketplaceListing,
    rawPayload?: Record<string, unknown>,
  ) {
    const db = getDb();
    const [row] = await db
      .insert(mhListings)
      .values({
        scanId,
        platform: listing.platform,
        listingKey: listingKey(listing),
        rawPayload: rawPayload ?? (listing as unknown as Record<string, unknown>),
      })
      .returning();
    return row;
  }

  async saveListings(scanId: string, listings: MarketplaceListing[]) {
    if (listings.length === 0) return [];
    const db = getDb();
    return db
      .insert(mhListings)
      .values(
        listings.map((listing) => ({
          scanId,
          platform: listing.platform,
          listingKey: listingKey(listing),
          rawPayload: listing as unknown as Record<string, unknown>,
        })),
      )
      .returning();
  }

  async recordSpend(input: {
    scanId: string | null;
    provider: MhSpendProvider;
    operation: string;
    costUsd: number;
    units?: number;
  }) {
    const db = getDb();
    const [row] = await db
      .insert(mhSpendLedger)
      .values({
        scanId: input.scanId,
        provider: input.provider,
        operation: input.operation,
        costUsd: String(input.costUsd),
        units: input.units ?? 1,
      })
      .returning();
    return row;
  }

  async getScanSpendTotal(scanId: string): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${mhSpendLedger.costUsd}), 0)`,
      })
      .from(mhSpendLedger)
      .where(eq(mhSpendLedger.scanId, scanId));
    return Number(row?.total ?? 0);
  }

  async listListingsForScan(scanId: string) {
    const db = getDb();
    return db.select().from(mhListings).where(eq(mhListings.scanId, scanId));
  }

  async createScanJob(scanId: string, payload?: Record<string, unknown>) {
    const db = getDb();
    const [row] = await db
      .insert(mhScanJobs)
      .values({ scanId, payload: payload ?? {} })
      .returning();
    return row;
  }

  async getPendingScanJobForScan(scanId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(mhScanJobs)
      .where(and(eq(mhScanJobs.scanId, scanId), eq(mhScanJobs.status, 'pending')))
      .orderBy(desc(mhScanJobs.createdAt))
      .limit(1);
    return row ?? null;
  }

  async claimScanJob(jobId: string) {
    const db = getDb();
    const [row] = await db
      .update(mhScanJobs)
      .set({
        status: 'running',
        claimedAt: new Date(),
        attempts: sql`${mhScanJobs.attempts} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(mhScanJobs.id, jobId), eq(mhScanJobs.status, 'pending')))
      .returning();
    return row ?? null;
  }

  async completeScanJob(jobId: string) {
    const db = getDb();
    const [row] = await db
      .update(mhScanJobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(mhScanJobs.id, jobId))
      .returning();
    return row ?? null;
  }

  async failScanJob(jobId: string, errorMessage: string) {
    const db = getDb();
    const [row] = await db
      .update(mhScanJobs)
      .set({
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mhScanJobs.id, jobId))
      .returning();
    return row ?? null;
  }

  async claimNextScanJob() {
    const db = getDb();
    const [pending] = await db
      .select()
      .from(mhScanJobs)
      .where(eq(mhScanJobs.status, 'pending'))
      .orderBy(mhScanJobs.createdAt)
      .limit(1);

    if (!pending) return null;
    return this.claimScanJob(pending.id);
  }

  async countActionCardsForScan(scanId: string) {
    const db = getDb();
    const rows = await db
      .select({ id: mhActionCards.id })
      .from(mhActionCards)
      .where(eq(mhActionCards.scanId, scanId));
    return rows.length;
  }

  async saveActionCards(scanId: string, cards: ActionCard[]) {
    if (cards.length === 0) return [];
    const db = getDb();
    return db
      .insert(mhActionCards)
      .values(
        cards.map((card) => ({
          scanId,
          rank: card.rank,
          status: 'pending' as MhActionCardStatus,
          card: card as unknown as Record<string, unknown>,
        })),
      )
      .returning();
  }

  async listActionCards(scanId: string) {
    const db = getDb();
    return db
      .select()
      .from(mhActionCards)
      .where(eq(mhActionCards.scanId, scanId))
      .orderBy(mhActionCards.rank);
  }

  async getActionCard(id: string) {
    const db = getDb();
    const [row] = await db.select().from(mhActionCards).where(eq(mhActionCards.id, id));
    return row ?? null;
  }

  async approveActionCard(id: string) {
    const db = getDb();
    const [row] = await db
      .update(mhActionCards)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        dismissedAt: null,
      })
      .where(eq(mhActionCards.id, id))
      .returning();
    return row ?? null;
  }

  async dismissActionCard(id: string) {
    const db = getDb();
    const [row] = await db
      .update(mhActionCards)
      .set({
        status: 'dismissed',
        dismissedAt: new Date(),
      })
      .where(eq(mhActionCards.id, id))
      .returning();
    return row ?? null;
  }

  async reclaimStaleScanJobs(staleMinutes = 30) {
    const db = getDb();
    const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);
    const rows = await db
      .update(mhScanJobs)
      .set({
        status: 'pending',
        claimedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mhScanJobs.status, 'running'),
          lt(mhScanJobs.claimedAt, cutoff),
          sql`${mhScanJobs.attempts} < ${mhScanJobs.maxAttempts}`,
        ),
      )
      .returning({ id: mhScanJobs.id });
    return rows.length;
  }

  async getTotalSpendUsd(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<string>`coalesce(sum(${mhSpendLedger.costUsd}), 0)`,
      })
      .from(mhSpendLedger);
    return Number(row?.total ?? 0);
  }

  async listRecentSpend(limit = 50) {
    const db = getDb();
    return db
      .select()
      .from(mhSpendLedger)
      .orderBy(desc(mhSpendLedger.createdAt))
      .limit(limit);
  }
}
