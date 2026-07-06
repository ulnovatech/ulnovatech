import { GmailReplyService } from '@agency/integrations';
import { NextResponse } from 'next/server';

const gmail = new GmailReplyService();

export async function GET() {
  try {
    const status = await gmail.getConnectionStatus();
    return NextResponse.json(status);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
