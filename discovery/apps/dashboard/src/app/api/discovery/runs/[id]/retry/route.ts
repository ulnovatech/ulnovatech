import { requireOperator } from '@/lib/api-auth';
import { resumeRunPipeline } from '@/lib/job-worker';
import { JobQueue } from '@agency/acquisition';
import { DiscoveryRepository } from '@agency/discovery';
import { NextResponse } from 'next/server';

const queue = new JobQueue();
const discoveryRepo = new DiscoveryRepository();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const run = await discoveryRepo.getRun(id);
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const retried = await queue.retryFromFailedStage(id);
    if (!retried) {
      return NextResponse.json(
        { error: 'No failed pipeline stage to retry' },
        { status: 409 },
      );
    }

    await discoveryRepo.updateRunStatus(id, 'pending', {
      errorMessage: null,
      completedAt: null,
    });

    await resumeRunPipeline(id, { maxSteps: 2 });

    return NextResponse.json({
      ok: true,
      stage: retried.stage,
      jobId: retried.jobId,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
