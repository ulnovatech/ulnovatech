import { logger } from '@agency/config';
import { captureException } from '@agency/config/observability';
import { MarketHunterService } from '@agency/market-hunter';

const service = new MarketHunterService();

/** Dev convenience: run hunter scans inline when API starts a scan (mirrors INLINE_PIPELINE). */
export function isInlineHunterEnabled(nodeEnv: string | undefined = process.env.NODE_ENV) {
  if (nodeEnv !== 'development') return false;
  return (
    process.env.INLINE_HUNTER?.trim().toLowerCase() === 'true' ||
    process.env.INLINE_PIPELINE?.trim().toLowerCase() === 'true'
  );
}

export async function processNextHunterJob() {
  try {
    const result = await service.claimAndExecuteNextJob();
    if (!result) return false;

    logger.info('Market Hunter scan completed', {
      scanId: result.scanId,
      cards: result.cards.length,
      spendUsd: result.stats.spendUsd,
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Market Hunter job failed', { error: message });
    captureException(err, { subsystem: 'market-hunter' });
    return true;
  }
}

export async function executeScanInline(scanId: string) {
  const result = await service.executeScan(scanId);
  return result;
}

export async function hunterWorkerTick(staleMinutes = 30) {
  await service.reclaimStaleJobs(staleMinutes);
  return processNextHunterJob();
}

export async function drainHunterOnce() {
  return hunterWorkerTick();
}

export { service as marketHunterService };
