import { requireOperator } from '@/lib/api-auth';
import { IntentService } from '@agency/intent';
import { pasteDemandIntentSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const intent = new IntentService();

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = pasteDemandIntentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await intent.ingestPaste(parsed.data);
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
