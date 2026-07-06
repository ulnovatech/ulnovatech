import type { IJobQueue } from './contracts';
import { JobRepository } from './job-repository';
import type { AcquisitionJobStage, RunProgress } from './types';

export class JobQueue implements IJobQueue {
  private repo = new JobRepository();

  reclaimStaleJobs(maxAgeMinutes?: number) {
    return this.repo.reclaimStaleJobs(maxAgeMinutes);
  }

  async enqueue(input: {
    runId: string;
    stage: string;
    payload?: Record<string, unknown>;
    maxAttempts?: number;
  }) {
    const job = await this.repo.insert(input);
    return { id: job.id };
  }

  async enqueueStages(runId: string, stages: AcquisitionJobStage[]) {
    const jobs = [];
    for (const stage of stages) {
      const { id } = await this.enqueue({ runId, stage });
      jobs.push({ id, stage });
    }
    return jobs;
  }

  async claim() {
    const job = await this.repo.claimNextPending();
    if (!job) return null;
    return {
      id: job.id,
      runId: job.runId,
      stage: job.stage,
      payload: (job.payload as Record<string, unknown> | null) ?? null,
    };
  }

  async complete(jobId: string, payload?: Record<string, unknown>) {
    const job = await this.repo.findById(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    await this.repo.updateStatus(jobId, 'completed', {
      completedAt: new Date(),
      payload,
    });
  }

  async claimForRun(runId: string) {
    const job = await this.repo.claimNextPendingForRun(runId);
    if (!job) return null;
    return {
      id: job.id,
      runId: job.runId,
      stage: job.stage,
      payload: (job.payload as Record<string, unknown> | null) ?? null,
    };
  }

  async fail(jobId: string, error: string) {
    const job = await this.repo.findById(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);

    const updated = await this.repo.requeueOrFail(jobId, error, job.maxAttempts);
    if (!updated) throw new Error(`Failed to update job: ${jobId}`);
    return { status: updated.status as 'pending' | 'failed', requeued: updated.status === 'pending' };
  }

  async retryFromFailedStage(runId: string) {
    return this.repo.retryFailedStage(runId);
  }

  async getRunProgress(runId: string): Promise<RunProgress> {
    const jobs = await this.repo.findByRunId(runId);
    const completed = jobs.filter((j) => j.status === 'completed').length;
    const failed = jobs.filter((j) => j.status === 'failed').length;
    const pending = jobs.filter((j) => j.status === 'pending').length;
    const running = jobs.filter((j) => j.status === 'running').length;
    const current = jobs.find((j) => j.status === 'running' || j.status === 'pending');

    return {
      runId,
      total: jobs.length,
      completed,
      failed,
      pending,
      running,
      currentStage: (current?.stage as AcquisitionJobStage) ?? null,
      jobs: jobs.map((j) => {
        const payload = (j.payload as Record<string, unknown> | null) ?? null;
        const lastErrorRaw = payload?.lastError;
        const lastError =
          lastErrorRaw &&
          typeof lastErrorRaw === 'object' &&
          'message' in lastErrorRaw &&
          'at' in lastErrorRaw
            ? {
                message: String((lastErrorRaw as { message: unknown }).message),
                at: String((lastErrorRaw as { at: unknown }).at),
              }
            : j.errorMessage
              ? { message: j.errorMessage, at: j.updatedAt.toISOString() }
              : null;

        const claimedAt = j.claimedAt?.toISOString() ?? null;
        const completedAt = j.completedAt?.toISOString() ?? null;
        const startMs = j.claimedAt?.getTime() ?? j.createdAt.getTime();
        const endMs = j.completedAt?.getTime() ?? null;
        const durationMs =
          endMs != null && startMs != null ? Math.max(0, endMs - startMs) : null;

        return {
          id: j.id,
          stage: j.stage,
          status: j.status as RunProgress['jobs'][0]['status'],
          attempts: j.attempts,
          errorMessage: j.errorMessage,
          claimedAt,
          completedAt,
          createdAt: j.createdAt.toISOString(),
          durationMs,
          lastError,
        };
      }),
    };
  }
}
