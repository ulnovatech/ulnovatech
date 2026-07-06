import { DiscoveryService, getRunWithEnrichedBusinesses } from '@agency/discovery';
import { IntentService } from '@agency/intent';
import { NextResponse } from 'next/server';

const discovery = new DiscoveryService();
const intent = new IntentService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const data = await getRunWithEnrichedBusinesses(id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const businesses = await Promise.all(
      data.businesses.map(async (b) => ({
        ...b,
        signals: await intent.listByBusiness(b.id),
      })),
    );

    return NextResponse.json({ run: data.run, businesses });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
