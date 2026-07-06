import { QualificationService } from '@agency/qualification';
import { NextResponse } from 'next/server';

const qualification = new QualificationService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const brief = await qualification.getOpportunityBrief(businessId);
    return NextResponse.json({ brief });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
