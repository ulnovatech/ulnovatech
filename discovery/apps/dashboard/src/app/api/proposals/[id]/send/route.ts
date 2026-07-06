import { requireOperator } from '@/lib/api-auth';
import { apiErrorStatus } from '@/lib/api-errors';
import { ProposalService } from '@agency/proposal';
import { NextResponse } from 'next/server';

const proposal = new ProposalService();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const p = await proposal.markSent(id);
    return NextResponse.json({ proposal: p });
  } catch (e) {
    const msg = String(e);
    return NextResponse.json({ error: msg }, { status: apiErrorStatus(msg) });
  }
}
