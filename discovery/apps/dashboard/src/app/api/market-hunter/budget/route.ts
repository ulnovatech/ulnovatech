import { requireOperator } from '@/lib/api-auth';
import { marketHunterService } from '@/lib/hunter-worker';
import { NextResponse } from 'next/server';

export async function GET() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const budget = await marketHunterService.getBudgetSummary();
    return NextResponse.json({ budget });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
