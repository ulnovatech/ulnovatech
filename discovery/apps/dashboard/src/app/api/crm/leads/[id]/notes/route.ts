import { requireOperator } from '@/lib/api-auth';
import { CrmService } from '@agency/crm';
import { createNoteSchema } from '@agency/validation';
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
    const body = await request.json();
    const parsed = createNoteSchema.safeParse({ ...body, leadId: id });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const note = await crm.addNote(id, parsed.data.content);
    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
