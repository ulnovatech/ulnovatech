import { requireOperator } from '@/lib/api-auth';
import { QualificationService } from '@agency/qualification';
import { NextResponse } from 'next/server';

const qualification = new QualificationService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { accountId } = await params;
    const result = await qualification.dismissFromReview(accountId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
