import { resolveOwnerScope } from '@/lib/owner-scope';
import { CrmService } from '@agency/crm';
import { NextResponse } from 'next/server';

const crm = new CrmService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = await resolveOwnerScope(searchParams.get('owner'));
    const leads = await crm.listFollowUps(owner);
    return NextResponse.json({
      leads,
      ownerScope: owner ?? 'all',
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
