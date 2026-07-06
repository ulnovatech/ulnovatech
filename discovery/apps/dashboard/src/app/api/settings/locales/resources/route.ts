import { LOCALE_EXTERNAL_RESOURCES } from '@agency/settings';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ resources: LOCALE_EXTERNAL_RESOURCES });
}
