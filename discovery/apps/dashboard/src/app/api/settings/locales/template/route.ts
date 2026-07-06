import { LOCALE_TEMPLATE_DOC } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(LOCALE_TEMPLATE_DOC, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="locale-pack-template.txt"',
    },
  });
}
