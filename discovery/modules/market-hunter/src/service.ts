import { platformSettings } from '@agency/settings';
import { runScanPipeline, type ScanPipelineStats } from './orchestrator';
import type { ActionCard } from './output/action-card';
import { MarketHunterRepository } from './repository';
import type { MhScanStatus } from './types';

export type MarketHunterScanRecord = {
  id: string;
  status: MhScanStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  stats: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: Date;
};

function asScanRecord(row: {
  id: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  stats: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: Date;
} | null): MarketHunterScanRecord | null {
  if (!row) return null;
  return { ...row, status: row.status as MhScanStatus };
}

export class MarketHunterService {
  constructor(private readonly repo = new MarketHunterRepository()) {}

  async startScan(): Promise<{ scanId: string; jobId: string }> {
    await platformSettings.ensureLoaded();
    const mh = platformSettings.getSync().marketHunter;
    if (!mh.enabled) {
      throw new Error('Market Hunter is disabled in settings');
    }

    const scan = await this.repo.createScan();
    const job = await this.repo.createScanJob(scan.id);
    return { scanId: scan.id, jobId: job.id };
  }

  async getScan(scanId: string) {
    return this.repo.getScan(scanId);
  }

  async listScans(limit = 50) {
    return this.repo.listScans(limit);
  }

  async listActionCards(scanId: string) {
    return this.repo.listActionCards(scanId);
  }

  async approveCard(cardId: string) {
    return this.repo.approveActionCard(cardId);
  }

  async dismissCard(cardId: string) {
    return this.repo.dismissActionCard(cardId);
  }

  async getBudgetSummary() {
    await platformSettings.ensureLoaded();
    const mh = platformSettings.getSync().marketHunter;
    const [totalSpendUsd, recentSpend] = await Promise.all([
      this.repo.getTotalSpendUsd(),
      this.repo.listRecentSpend(50),
    ]);

    return {
      maxSpendPerRunUsd: mh.maxSpendPerRunUsd,
      totalSpendUsd,
      recentSpend: recentSpend.map((row) => ({
        id: row.id,
        scanId: row.scanId,
        provider: row.provider,
        operation: row.operation,
        costUsd: Number(row.costUsd),
        units: row.units,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Execute a scan pipeline. Idempotent per scan — completed scans with cards are not re-run.
   */
  async executeScan(scanId: string): Promise<{
    scan: MarketHunterScanRecord | null;
    cards: ActionCard[];
    stats: ScanPipelineStats;
  }> {
    const existing = await this.repo.getScan(scanId);
    if (!existing) {
      throw new Error(`Scan not found: ${scanId}`);
    }

    if (existing.status === 'completed') {
      const cards = (await this.repo.listActionCards(scanId)).map((row) => row.card as ActionCard);
      return {
        scan: asScanRecord(existing)!,
        cards,
        stats: (existing.stats as ScanPipelineStats | null) ?? {
          listingsFetched: 0,
          ghostsFiltered: 0,
          cardsGenerated: cards.length,
          spendUsd: await this.repo.getScanSpendTotal(scanId),
          byPlatform: {},
          type1Flags: [],
        },
      };
    }

    const pendingJob = await this.repo.getPendingScanJobForScan(scanId);
    const claimedJob = pendingJob ? await this.repo.claimScanJob(pendingJob.id) : null;

    await this.repo.updateScanStatus(scanId, 'running', { startedAt: new Date(), errorMessage: null });

    try {
      const existingCards = await this.repo.countActionCardsForScan(scanId);
      if (existingCards > 0) {
        const cards = (await this.repo.listActionCards(scanId)).map((row) => row.card as ActionCard);
        const spendUsd = await this.repo.getScanSpendTotal(scanId);
        const stats = (existing.stats as ScanPipelineStats | null) ?? {
          listingsFetched: 0,
          ghostsFiltered: 0,
          cardsGenerated: cards.length,
          spendUsd,
          byPlatform: {},
          type1Flags: [],
        };

        const scan = await this.repo.updateScanStatus(scanId, 'completed', {
          completedAt: new Date(),
          stats: stats as Record<string, unknown>,
        });

        if (claimedJob) await this.repo.completeScanJob(claimedJob.id);
        return { scan: asScanRecord(scan)!, cards, stats };
      }

      const { cards, stats } = await runScanPipeline(scanId, { repo: this.repo });

      if (cards.length > 0) {
        await this.repo.saveActionCards(scanId, cards);
      }

      const scan = await this.repo.updateScanStatus(scanId, 'completed', {
        completedAt: new Date(),
        stats: stats as Record<string, unknown>,
      });

      if (claimedJob) await this.repo.completeScanJob(claimedJob.id);

      return { scan: asScanRecord(scan)!, cards, stats };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const scan = await this.repo.updateScanStatus(scanId, 'failed', {
        completedAt: new Date(),
        errorMessage: message,
      });
      if (claimedJob) await this.repo.failScanJob(claimedJob.id, message);
      throw Object.assign(new Error(message), { scan: asScanRecord(scan) });
    }
  }

  async reclaimStaleJobs(staleMinutes = 30) {
    return this.repo.reclaimStaleScanJobs(staleMinutes);
  }

  async claimAndExecuteNextJob(): Promise<{
    scanId: string;
    cards: ActionCard[];
    stats: ScanPipelineStats;
  } | null> {
    const job = await this.repo.claimNextScanJob();
    if (!job) return null;
    const result = await this.executeScan(job.scanId);
    return {
      scanId: job.scanId,
      cards: result.cards,
      stats: result.stats,
    };
  }
}
