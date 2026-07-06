import { acquisitionJobs, getDb } from '@agency/database';

import { asc, eq, sql } from 'drizzle-orm';

import type { JobStatus } from './types';



export const DEFAULT_STALE_JOB_MINUTES = 15;



type ClaimedJobRow = typeof acquisitionJobs.$inferSelect;

type RawJobRow = Record<string, unknown>;

function mapClaimedJobRow(row: RawJobRow): ClaimedJobRow {
  return {
    id: String(row.id),
    runId: String(row.run_id ?? row.runId),
    stage: String(row.stage),
    status: String(row.status) as JobStatus,
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? row.maxAttempts ?? 3),
    errorMessage: (row.error_message ?? row.errorMessage ?? null) as string | null,
    claimedAt: (row.claimed_at ?? row.claimedAt ?? null) as Date | null,
    completedAt: (row.completed_at ?? row.completedAt ?? null) as Date | null,
    createdAt: (row.created_at ?? row.createdAt) as Date,
    updatedAt: (row.updated_at ?? row.updatedAt) as Date,
  };
}



export class JobRepository {

  async insert(data: {

    runId: string;

    stage: string;

    payload?: Record<string, unknown>;

    maxAttempts?: number;

  }) {

    const db = getDb();

    const [job] = await db

      .insert(acquisitionJobs)

      .values({

        runId: data.runId,

        stage: data.stage,

        payload: data.payload ?? null,

        maxAttempts: data.maxAttempts ?? 3,

        status: 'pending',

      })

      .returning();

    return job;

  }



  async findByRunId(runId: string) {

    const db = getDb();

    return db

      .select()

      .from(acquisitionJobs)

      .where(eq(acquisitionJobs.runId, runId))

      .orderBy(asc(acquisitionJobs.createdAt));

  }



  async findById(id: string) {

    const db = getDb();

    const [job] = await db.select().from(acquisitionJobs).where(eq(acquisitionJobs.id, id));

    return job ?? null;

  }



  /**

   * Reset jobs stuck in `running` (e.g. worker crash) back to `pending`.

   */

  async reclaimStaleJobs(maxAgeMinutes = DEFAULT_STALE_JOB_MINUTES): Promise<number> {
    const db = getDb();
    const minutes = Math.max(1, maxAgeMinutes);

    await db.execute(sql`
      UPDATE acquisition_jobs
      SET
        status = 'failed',
        error_message = COALESCE(error_message, 'Job exceeded max attempts while running'),
        completed_at = NOW(),
        updated_at = NOW()
      WHERE status = 'running'
        AND attempts >= max_attempts
    `);

    const result = await db.execute<{ id: string }>(sql`

      UPDATE acquisition_jobs

      SET

        status = 'pending',

        claimed_at = NULL,

        updated_at = NOW()

      WHERE status = 'running'
        AND (
          claimed_at IS NULL
          OR claimed_at < NOW() - (${minutes}::int * INTERVAL '1 minute')
          OR claimed_at > NOW() + INTERVAL '1 minute'
        )

      RETURNING id

    `);

    return result.length;

  }



  async claimNextPending() {

    const db = getDb();

    const result = await db.execute<ClaimedJobRow>(sql`

      UPDATE acquisition_jobs

      SET

        status = 'running',

        attempts = attempts + 1,

        claimed_at = NOW(),

        updated_at = NOW()

      WHERE id = (

        SELECT id FROM acquisition_jobs

        WHERE status = 'pending'

        ORDER BY created_at ASC

        LIMIT 1

        FOR UPDATE SKIP LOCKED

      )

      RETURNING *

    `);

    const row = result[0];

    return row ? mapClaimedJobRow(row as RawJobRow) : null;

  }



  async updateStatus(

    id: string,

    status: JobStatus,

    extra?: { errorMessage?: string; completedAt?: Date; payload?: Record<string, unknown> },

  ) {

    const db = getDb();

    const [job] = await db

      .update(acquisitionJobs)

      .set({

        status,

        errorMessage: extra?.errorMessage ?? null,

        completedAt: extra?.completedAt ?? (status === 'completed' ? new Date() : undefined),

        ...(extra?.payload !== undefined && { payload: extra.payload }),

        updatedAt: new Date(),

      })

      .where(eq(acquisitionJobs.id, id))

      .returning();

    return job ?? null;

  }



  async claimNextPendingForRun(runId: string) {

    const db = getDb();

    const result = await db.execute<ClaimedJobRow>(sql`

      UPDATE acquisition_jobs

      SET

        status = 'running',

        attempts = attempts + 1,

        claimed_at = NOW(),

        updated_at = NOW()

      WHERE id = (

        SELECT id FROM acquisition_jobs

        WHERE status = 'pending' AND run_id = ${runId}::uuid

        ORDER BY created_at ASC

        LIMIT 1

        FOR UPDATE SKIP LOCKED

      )

      RETURNING *

    `);

    const row = result[0];

    return row ? mapClaimedJobRow(row as RawJobRow) : null;

  }



  async requeueOrFail(id: string, error: string, maxAttempts: number) {

    const job = await this.findById(id);

    if (!job) return null;



    if (job.attempts >= maxAttempts) {
      const payload = {
        ...((job.payload as Record<string, unknown> | null) ?? {}),
        lastError: { message: error, at: new Date().toISOString() },
      };
      return this.updateStatus(id, 'failed', {
        errorMessage: error,
        completedAt: new Date(),
        payload,
      });
    }



    const db = getDb();

    const [updated] = await db

      .update(acquisitionJobs)

      .set({

        status: 'pending',

        errorMessage: error,

        claimedAt: null,

        updatedAt: new Date(),

      })

      .where(eq(acquisitionJobs.id, id))

      .returning();

    return updated ?? null;

  }

  /**
   * Operator retry: reset the first failed stage to pending without re-running completed stages.
   */
  async retryFailedStage(runId: string) {
    const jobs = await this.findByRunId(runId);
    const failed = jobs.find((j) => j.status === 'failed');
    if (!failed) return null;

    const db = getDb();
    const payload = { ...((failed.payload as Record<string, unknown> | null) ?? {}) };
    delete payload.lastError;

    const [updated] = await db
      .update(acquisitionJobs)
      .set({
        status: 'pending',
        claimedAt: null,
        completedAt: null,
        errorMessage: null,
        attempts: 0,
        payload: Object.keys(payload).length > 0 ? payload : null,
        updatedAt: new Date(),
      })
      .where(eq(acquisitionJobs.id, failed.id))
      .returning();

    return updated ? { jobId: updated.id, stage: updated.stage } : null;
  }

}


