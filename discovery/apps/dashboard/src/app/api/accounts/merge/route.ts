import { AccountMergeError, AccountMergeService, type DuplicateMatchKind } from '@agency/accounts';
import { requireOperator } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const mergeService = new AccountMergeService();

const bodySchema = z.object({
  survivorId: z.string().uuid(),
  mergedId: z.string().uuid(),
  matchKinds: z.array(z.enum(['phone', 'domain', 'externalId', 'nameCity'])).optional(),
});

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const account = await mergeService.mergeAccounts(
      parsed.data.survivorId,
      parsed.data.mergedId,
      operator,
      parsed.data.matchKinds as DuplicateMatchKind[] | undefined,
    );

    return NextResponse.json({ account });
  } catch (e) {
    if (e instanceof AccountMergeError) {
      const status =
        e.code === 'NOT_FOUND' ? 404 : e.code === 'ACTIVE_LEAD_CONFLICT' ? 409 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
