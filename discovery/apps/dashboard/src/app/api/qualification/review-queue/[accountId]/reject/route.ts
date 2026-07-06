import { requireOperator } from '@/lib/api-auth';
import { QualificationService } from '@agency/qualification';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const qualification = new QualificationService();

const bodySchema = z.object({ reason: z.string().max(500).optional() }).optional();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { accountId } = await params;
    let reason: string | undefined;
    try {
      const body = await request.json();
      const parsed = bodySchema.safeParse(body);
      reason = parsed.success ? parsed.data?.reason : undefined;
    } catch {
      reason = undefined;
    }
    const result = await qualification.rejectFromReview(accountId, reason);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
