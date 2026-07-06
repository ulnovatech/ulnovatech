import { requireOperator } from '@/lib/api-auth';
import { IntelligenceService } from '@agency/intelligence';
import { NextResponse } from 'next/server';

const intelligence = new IntelligenceService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { businessId } = await params;
    const analysis = await intelligence.analyzeBusiness(businessId);
    return NextResponse.json({ analysis });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const analysis = await intelligence.getAnalysis(businessId);
    return NextResponse.json({ analysis });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
