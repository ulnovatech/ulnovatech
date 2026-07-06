import { requireOperator } from '@/lib/api-auth';
import { apiErrorStatus } from '@/lib/api-errors';
import { RevenueService } from '@agency/revenue';
import { NextResponse } from 'next/server';

const revenue = new RevenueService();

export async function GET() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const deals = await revenue.listCloseableDeals();
    return NextResponse.json({ deals });
  } catch (e) {
    const msg = String(e);
    return NextResponse.json({ error: msg }, { status: apiErrorStatus(msg) });
  }
}
