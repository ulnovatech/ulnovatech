import { BiProfileService } from '@agency/intelligence';
import { NextResponse } from 'next/server';

const bi = new BiProfileService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const brief = await bi.getOpportunityBrief(businessId);
    return NextResponse.json({ brief });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message.includes('not found') || message.includes('not available') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
