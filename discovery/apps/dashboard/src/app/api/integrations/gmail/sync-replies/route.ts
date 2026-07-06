import { requireOperator } from '@/lib/api-auth';
import { GmailReplyService } from '@agency/integrations';
import { NextResponse } from 'next/server';

const gmail = new GmailReplyService();

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    let days = 7;
    try {
      const body = await request.json();
      if (typeof body?.days === 'number') days = body.days;
    } catch {
      // empty body is fine
    }
    const result = await gmail.syncReplies(days);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
