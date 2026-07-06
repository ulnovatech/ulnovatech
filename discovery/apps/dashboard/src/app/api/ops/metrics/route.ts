import { OpsMetricsService } from '@agency/ops';
import { NextResponse } from 'next/server';

const ops = new OpsMetricsService();

export async function GET() {
  try {
    const metrics = await ops.getMetrics();
    return NextResponse.json(metrics);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
