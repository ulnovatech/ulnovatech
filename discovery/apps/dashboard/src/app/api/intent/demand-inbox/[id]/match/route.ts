import { requireOperator } from '@/lib/api-auth';
import { IntentService } from '@agency/intent';
import { QualificationService } from '@agency/qualification';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const intent = new IntentService();
const qualification = new QualificationService();

const bodySchema = z.object({
  businessId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await intent.matchDemandToBusiness(id, parsed.data.businessId);
    const score = await qualification.scoreBusiness(result.businessId);
    return NextResponse.json({ ...result, score });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
