import { requireOperator } from '@/lib/api-auth';
import { resolveOwnerScope } from '@/lib/owner-scope';
import { CrmService } from '@agency/crm';
import { createLeadSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const crm = new CrmService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = await resolveOwnerScope(searchParams.get('owner'));
    const leads = await crm.listLeads(owner);
    return NextResponse.json({
      leads,
      ownerScope: owner ?? 'all',
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
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const operatorId = operator;
    const { promoteOnly, status, ...rest } = parsed.data;
    const lead = await crm.createLeadFromBusiness({
      ...rest,
      promoteOnly,
      status,
      owner: operatorId ?? parsed.data.owner,
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
