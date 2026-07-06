import { requireOperator } from '@/lib/api-auth';
import { OutreachService } from '@agency/outreach';
import { createOutreachMessageSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const outreach = new OutreachService();

export async function GET(request: Request) {
  try {
    const leadId = new URL(request.url).searchParams.get('leadId') ?? undefined;
    const messages = await outreach.listMessages(leadId ?? undefined);
    return NextResponse.json({ messages });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = createOutreachMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const message = await outreach.sendMessage(parsed.data);
    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
