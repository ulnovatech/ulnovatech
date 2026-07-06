import { requireOperator } from '@/lib/api-auth';
import { CrmService } from '@agency/crm';
import { markRepliedSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const crm = new CrmService();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const parsed = markRepliedSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const lead = await crm.markReplied(id, parsed.data);
    return NextResponse.json({ lead });
  } catch (e) {
    const msg = String(e);
    const status = msg.includes('Cannot mark replied') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
