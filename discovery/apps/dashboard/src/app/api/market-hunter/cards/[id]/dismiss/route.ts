import { requireOperator } from '@/lib/api-auth';
import { marketHunterService } from '@/lib/hunter-worker';
import { serializeActionCardRow } from '@/lib/market-hunter-api';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const card = await marketHunterService.dismissCard(id);
    if (!card) {
      return NextResponse.json({ error: 'Action card not found' }, { status: 404 });
    }

    return NextResponse.json({ card: serializeActionCardRow(card) });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
