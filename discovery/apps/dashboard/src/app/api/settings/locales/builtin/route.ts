import {
  buildBuiltinLocalePack,
  localePackToDocument,
  localePackToJson,
} from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'doc' ? 'doc' : 'json';
  const pack = buildBuiltinLocalePack();

  if (format === 'doc') {
    return new NextResponse(localePackToDocument(pack), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="builtin-locale-lexicon.txt"',
      },
    });
  }

  return new NextResponse(localePackToJson(pack), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="builtin-locale-lexicon.json"',
    },
  });
}
