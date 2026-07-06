import {
  getPipelinePlan,
  getWorkerHeartbeat,
  isWorkerHeartbeatStale,
  JobQueue,
  listPipelineLogs,
  type AcquisitionJobStage,
  type JobStatus,
} from '@agency/acquisition';
import { DiscoveryRepository } from '@agency/discovery';
import { isInlinePipelineEnabled, resumeRunPipeline } from '@/lib/job-worker';
import { NextResponse } from 'next/server';

const queue = new JobQueue();
const discoveryRepo = new DiscoveryRepository();

function mergePlannedJobs(
  plan: AcquisitionJobStage[],
  jobs: Awaited<ReturnType<JobQueue['getRunProgress']>>['jobs'],
) {
  if (plan.length === 0) return jobs;

  return plan.map((stage) => {
    const existing = jobs.find((j) => j.stage === stage);
    if (existing) return existing;

    const stageIdx = plan.indexOf(stage);
    const priorComplete = plan
      .slice(0, stageIdx)
      .every((s) => jobs.some((j) => j.stage === s && j.status === 'completed'));

    return {
      id: `planned-${stage}`,
      stage,
      status: (priorComplete ? 'queued' : 'waiting') as JobStatus | 'waiting' | 'queued',
      attempts: 0,
      errorMessage: null,
      claimedAt: null,
      completedAt: null,
      createdAt: new Date(0).toISOString(),
      durationMs: null,
      lastError: null,
    };
  });
}

export const maxDuration = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await params;

    const run = await discoveryRepo.getRun(runId);
    const isActive = run?.status === 'pending' || run?.status === 'running';

    if (isInlinePipelineEnabled() && isActive) {
      await resumeRunPipeline(runId);
    }

    const [progress, plan, pipelineLog] = await Promise.all([
      queue.getRunProgress(runId),
      getPipelinePlan(runId),
      listPipelineLogs(runId),
    ]);

    const plannedStages = (plan.length > 0 ? plan : progress.jobs.map((j) => j.stage)) as AcquisitionJobStage[];
    const mergedJobs = mergePlannedJobs(plannedStages, progress.jobs);
    const plannedTotal = plannedStages.length || progress.total;
    const completedInPlan = plannedStages.filter((stage) =>
      progress.jobs.some((j) => j.stage === stage && j.status === 'completed'),
    ).length;
    const runningStage = progress.jobs.find((j) => j.status === 'running')?.stage ?? null;
    const activeStageIndex = runningStage ? plannedStages.indexOf(runningStage as AcquisitionJobStage) : -1;
    const percent =
      plannedTotal === 0
        ? 0
        : runningStage && completedInPlan < plannedTotal
          ? Math.max(
              Math.round((completedInPlan / plannedTotal) * 100),
              Math.round(((activeStageIndex + 0.25) / plannedTotal) * 100),
            )
          : Math.round((completedInPlan / plannedTotal) * 100);

    const heartbeat = await getWorkerHeartbeat();
    const workerStale = isWorkerHeartbeatStale(heartbeat);

    return NextResponse.json({
      ...progress,
      jobs: mergedJobs,
      plannedStages,
      plannedTotal,
      completedInPlan,
      runningStage,
      pipelineLog,
      percent,
      runStatus: run?.status ?? null,
      workerLastSeenAt: heartbeat?.at ?? null,
      workerStale: isInlinePipelineEnabled() ? false : workerStale,
      inlinePipeline: isInlinePipelineEnabled(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
