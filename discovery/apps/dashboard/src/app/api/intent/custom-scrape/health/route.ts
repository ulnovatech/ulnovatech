import { IntentService } from '@agency/intent';
import { NextResponse } from 'next/server';

const intent = new IntentService();

export async function GET() {
  try {
    const health = await intent.customScrapeHealth();
    return NextResponse.json({ health });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
