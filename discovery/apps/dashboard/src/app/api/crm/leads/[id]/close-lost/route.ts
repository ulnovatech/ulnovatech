import { requireOperator } from '@/lib/api-auth';
import { CrmService } from '@agency/crm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const crm = new CrmService();

const bodySchema = z.object({
  reason: z.string().min(1).max(500),
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
    const lead = await crm.closeLost(id, parsed.data.reason);
    return NextResponse.json({ lead });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
