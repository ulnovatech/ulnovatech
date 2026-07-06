import { dynamic } from '@/lib/route-config';
export { dynamic };
import { pingDb } from '@agency/database';
import { NextResponse } from 'next/server';

export async function GET() {
  const dbOk = await pingDb();
  return NextResponse.json({
    status: dbOk ? 'ok' : 'degraded',
    version: '1.0.0',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
}
