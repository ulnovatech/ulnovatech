import { BudgetGovernor, getWorkerHeartbeat, isWorkerHeartbeatStale } from '@agency/acquisition';
import { platformSettings } from '@agency/settings';
import { NextResponse } from 'next/server';

const governor = new BudgetGovernor();

export async function GET() {
  try {
    await platformSettings.ensureLoaded();
    const providers = await governor.getSummary();
    const heartbeat = await getWorkerHeartbeat();
    return NextResponse.json({
      providers,
      acquisitionMode: platformSettings.getAcquisitionMode(),
      workerLastSeenAt: heartbeat?.at ?? null,
      workerStale: isWorkerHeartbeatStale(heartbeat),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
