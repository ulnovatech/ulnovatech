import { DiscoveryService } from '@agency/discovery';
import { requireOperator } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

const discovery = new DiscoveryService();

export async function DELETE() {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const result = await discovery.wipeAllRuns();
    return NextResponse.json({
      ok: true,
      deletedRuns: result.runs,
      deletedSignals: result.orphanSignals,
      message: `Wiped ${result.runs} discovery run(s) and ${result.orphanSignals} linked signal(s).`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
