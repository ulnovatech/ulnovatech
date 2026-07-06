import { isCronAuthorized } from '@/lib/cron-auth';
import { marketHunterService } from '@/lib/hunter-worker';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

/**
 * Cron-triggered scan — secured with CRON_SECRET (Bearer or x-cron-secret header).
 * Runs the full pipeline inline (no separate worker required for scheduled jobs).
 */
export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await platformSettings.ensureLoaded();
    const mh = platformSettings.getSync().marketHunter;

    if (!mh.enabled) {
      return NextResponse.json({
        skipped: true,
        reason: 'Market Hunter is disabled in settings',
      });
    }

    const { scanId, jobId } = await marketHunterService.startScan();
    const result = await marketHunterService.executeScan(scanId);

    return NextResponse.json({
      scanId,
      jobId,
      status: result.scan?.status ?? 'unknown',
      cardsGenerated: result.cards.length,
      spendUsd: result.stats.spendUsd,
      type1Flags: result.stats.type1Flags?.length ?? 0,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
