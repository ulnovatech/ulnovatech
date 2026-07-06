import { requireOperator } from '@/lib/api-auth';
import { OutreachService } from '@agency/outreach';
import { createOutreachTemplateSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const outreach = new OutreachService();

export async function GET() {
  try {
    const templates = await outreach.listTemplates();
    return NextResponse.json({
      templates,
      opportunityTypes: ['demand_response', 'greenfield', 'redesign', 'modernize', 'general'],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = createOutreachTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const template = await outreach.createTemplate(parsed.data);
    return NextResponse.json({ template }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
