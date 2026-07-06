import { requireOperator } from '@/lib/api-auth';
import { apiErrorStatus } from '@/lib/api-errors';
import { RevenueService } from '@agency/revenue';
import { createRevenueRecordSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const revenue = new RevenueService();

export async function GET() {
  try {
    const summary = await revenue.getSummary();
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = createRevenueRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await revenue.closeDeal(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = String(e);
    return NextResponse.json({ error: msg }, { status: apiErrorStatus(msg) });
  }
}
