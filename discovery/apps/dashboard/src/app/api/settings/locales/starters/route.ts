import { localePackToJson, STARTER_LOCALE_PACKS } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(localePackToJson(STARTER_LOCALE_PACKS), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="locale-pack-starters.json"',
    },
  });
}
