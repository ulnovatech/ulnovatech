import { requireOperator } from '@/lib/api-auth';
import { apiErrorStatus } from '@/lib/api-errors';
import { ProposalService } from '@agency/proposal';
import { createProposalSchema } from '@agency/validation';
import { NextResponse } from 'next/server';

const proposal = new ProposalService();

export async function GET(request: Request) {
  try {
    const leadId = new URL(request.url).searchParams.get('leadId') ?? undefined;
    const proposals = await proposal.listWithDetails(leadId ?? undefined);
    return NextResponse.json({ proposals });
  } catch (e) {
    const msg = String(e);
    return NextResponse.json({ error: msg }, { status: apiErrorStatus(msg) });
  }
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const p = await proposal.create(parsed.data);
    return NextResponse.json({ proposal: p }, { status: 201 });
  } catch (e) {
    const msg = String(e);
    return NextResponse.json({ error: msg }, { status: apiErrorStatus(msg) });
  }
}
