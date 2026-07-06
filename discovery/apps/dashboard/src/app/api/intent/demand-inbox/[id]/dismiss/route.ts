import { requireOperator } from '@/lib/api-auth';
import { IntentService } from '@agency/intent';
import { NextResponse } from 'next/server';

const intent = new IntentService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const result = await intent.dismissOrphanDemand(id);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
