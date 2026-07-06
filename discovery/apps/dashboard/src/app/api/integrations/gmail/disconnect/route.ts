import { requireOperator } from '@/lib/api-auth';
import { GmailReplyService } from '@agency/integrations';
import { NextResponse } from 'next/server';

const gmail = new GmailReplyService();

export async function POST() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const result = await gmail.disconnect();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
