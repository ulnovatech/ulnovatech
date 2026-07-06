import { BiProfileService } from '@agency/intelligence';
import { NextResponse } from 'next/server';

const bi = new BiProfileService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await params;
    const row = await bi.getByBusinessId(businessId);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      profile: row.profile,
      completenessScore: row.completenessScore,
      enrichedAt: row.enrichedAt,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
