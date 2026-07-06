import { AccountMergeError, AccountMergeService } from '@agency/accounts';
import { NextResponse } from 'next/server';

const mergeService = new AccountMergeService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('scan') === 'true') {
      const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 100);
      const groups = await mergeService.scanDuplicateGroups(limit);
      return NextResponse.json({ groups });
    }

    const accountId = searchParams.get('accountId');
    if (!accountId) {
      return NextResponse.json({ error: 'accountId or scan=true required' }, { status: 400 });
    }

    const candidates = await mergeService.findDuplicateCandidates(accountId);
    return NextResponse.json({ accountId, candidates });
  } catch (e) {
    if (e instanceof AccountMergeError && e.code === 'NOT_FOUND') {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
