import { getCsvImportFileInfo, getCsvTemplateContent } from '@agency/discovery';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    await platformSettings.ensureLoaded();
    const url = new URL(request.url);
    if (url.searchParams.get('template') === '1') {
      const template = getCsvTemplateContent();
      return new NextResponse(template, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="businesses-template.csv"',
        },
      });
    }

    const info = getCsvImportFileInfo();
    return NextResponse.json({ csv: info });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
