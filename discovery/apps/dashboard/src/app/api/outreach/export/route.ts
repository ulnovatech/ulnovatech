import { requireOperator } from '@/lib/api-auth';
import { resolveOwnerScope } from '@/lib/owner-scope';
import { OutreachService } from '@agency/outreach';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

const outreach = new OutreachService();

export async function GET(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    if (!templateId) {
      return NextResponse.json({ error: 'templateId required' }, { status: 400 });
    }

    const includeUnreviewed = searchParams.get('includeUnreviewed') === 'true';
    if (includeUnreviewed && request.headers.get('x-confirm-unreviewed') !== 'true') {
      return NextResponse.json(
        { error: 'Exporting NEW leads requires X-Confirm-Unreviewed: true header' },
        { status: 400 },
      );
    }

    const date = searchParams.get('date') ?? undefined;
    const owner = await resolveOwnerScope(searchParams.get('owner'));
    const settings = await platformSettings.ensureLoaded();
    const { csv, filename, count, skippedNoContact, skippedSuppressed, skippedReachability, statuses, minReachability } =
      await outreach.exportCsv({
        templateId,
        date,
        includeUnreviewed,
        owner,
        minReachability: settings.qualification.icp.minReachabilityForExport,
      });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Export-Count': String(count),
        'X-Export-Skipped-No-Contact': String(skippedNoContact),
        'X-Export-Skipped-Suppressed': String(skippedSuppressed),
        'X-Export-Skipped-Reachability': String(skippedReachability),
        'X-Export-Min-Reachability': minReachability,
        'X-Export-Statuses': statuses.join(','),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
