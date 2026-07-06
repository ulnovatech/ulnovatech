import { requireOperator } from '@/lib/api-auth';
import { GmailReplyService } from '@agency/integrations';
import { NextResponse } from 'next/server';

const gmail = new GmailReplyService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; suggestionId: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id, suggestionId } = await params;
    const result = await gmail.dismissSuggestion(id, suggestionId);
    return NextResponse.json(result);
  } catch (e) {
    const msg = String(e);
    const status = msg.includes('not found') ? 404 : msg.includes('already') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
