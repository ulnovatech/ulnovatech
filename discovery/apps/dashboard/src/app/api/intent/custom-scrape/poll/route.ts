import { IntentService } from '@agency/intent';
import { NextResponse } from 'next/server';

const intent = new IntentService();

export async function POST() {
  try {
    const result = await intent.pollCustomScrape();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
