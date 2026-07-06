import { requireOperator } from '@/lib/api-auth';
import { OutreachService } from '@agency/outreach';
import { NextResponse } from 'next/server';

const outreach = new OutreachService();

export async function GET(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const templateId = searchParams.get('templateId');
    const opener = searchParams.get('opener');
    if (!leadId || !templateId) {
      return NextResponse.json({ error: 'leadId and templateId required' }, { status: 400 });
    }
    const preview = await outreach.previewMessage(leadId, templateId, {
      opener: opener ?? undefined,
    });
    return NextResponse.json({ preview });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
