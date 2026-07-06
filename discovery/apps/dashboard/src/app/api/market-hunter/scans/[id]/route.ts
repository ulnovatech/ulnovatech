import { requireOperator } from '@/lib/api-auth';
import {
  executeScanInline,
  isInlineHunterEnabled,
  marketHunterService,
} from '@/lib/hunter-worker';
import { serializeScan } from '@/lib/market-hunter-api';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const scan = await marketHunterService.getScan(id);
    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (scan.status === 'pending' && isInlineHunterEnabled()) {
      await executeScanInline(id);
      const refreshed = await marketHunterService.getScan(id);
      return NextResponse.json({ scan: refreshed ? serializeScan(refreshed) : null });
    }

    return NextResponse.json({ scan: serializeScan(scan) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
