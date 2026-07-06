import { requireOperator } from '@/lib/api-auth';
import { IntentService } from '@agency/intent';
import { createIntentSignalSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const intent = new IntentService();

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = createIntentSignalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const signal = await intent.createSignal(parsed.data);
    return NextResponse.json({ signal }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
