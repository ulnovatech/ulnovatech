import { requireOperator } from '@/lib/api-auth';
import { getMarketHunterHealth } from '@agency/market-hunter';
import { NextResponse } from 'next/server';

export async function GET() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const health = await getMarketHunterHealth();
    return NextResponse.json(health);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
