import { requireOperator } from '@/lib/api-auth';
import {
  executeScanInline,
  isInlineHunterEnabled,
  marketHunterService,
} from '@/lib/hunter-worker';
import { serializeScan } from '@/lib/market-hunter-api';
import { NextResponse } from 'next/server';

export async function GET() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const scans = await marketHunterService.listScans();
    return NextResponse.json({ scans: scans.map(serializeScan) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { scanId, jobId } = await marketHunterService.startScan();
    const inline = isInlineHunterEnabled();

    if (inline) {
      await executeScanInline(scanId);
    }

    const scan = await marketHunterService.getScan(scanId);

    return NextResponse.json(
      {
        scanId,
        jobId,
        scan: scan ? serializeScan(scan) : null,
        queued: !inline,
        inlineHunter: inline,
        message: inline
          ? 'Scan started inline (INLINE_HUNTER / INLINE_PIPELINE dev mode)'
          : 'Scan queued — start hunter worker: pnpm hunter:worker',
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
