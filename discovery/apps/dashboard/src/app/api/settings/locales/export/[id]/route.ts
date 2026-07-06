import { localePackToDocument, localePackToJson, platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const settings = await platformSettings.ensureLoaded();
    const pack = settings.locales.packs.find((p) => p.id === params.id);
    if (!pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    const format = new URL(request.url).searchParams.get('format') ?? 'json';
    if (format === 'doc' || format === 'txt') {
      return new NextResponse(localePackToDocument(pack), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${pack.id}.txt"`,
        },
      });
    }

    return new NextResponse(localePackToJson(pack), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${pack.id}.json"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
