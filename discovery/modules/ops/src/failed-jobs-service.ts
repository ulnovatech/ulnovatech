import { getDb } from '@agency/database';
import { sql } from 'drizzle-orm';

export type FailedJobRow = {
  id: string;
  runId: string;
  stage: string;
  errorMessage: string | null;
  attempts: number;
  failedAt: string;
  run: {
    industry: string;
    city: string;
    country: string;
    status: string;
  };
};

export function clampFailedJobsDays(days: number | undefined): number {
  const n = days ?? 7;
  return Math.min(Math.max(Math.trunc(n), 1), 90);
}

export function clampFailedJobsLimit(limit: number | undefined): number {
  const n = limit ?? 50;
  return Math.min(Math.max(Math.trunc(n), 1), 50);
}

export class FailedJobsService {
  async list(days = 7, limit = 50): Promise<{
    days: number;
    count: number;
    jobs: FailedJobRow[];
  }> {
    const windowDays = clampFailedJobsDays(days);
    const rowLimit = clampFailedJobsLimit(limit);
    const db = getDb();

    const [countRow] = await db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM acquisition_jobs
      WHERE status = 'failed'
        AND updated_at >= NOW() - (${windowDays}::int * INTERVAL '1 day')
    `);

    const rows = await db.execute<{
      id: string;
      run_id: string;
      stage: string;
      error_message: string | null;
      attempts: number;
      failed_at: Date;
      industry: string;
      city: string;
      country: string;
      run_status: string;
    }>(sql`
      SELECT
        j.id,
        j.run_id,
        j.stage,
        j.error_message,
        j.attempts,
        j.updated_at AS failed_at,
        r.industry,
        r.city,
        r.country,
        r.status AS run_status
      FROM acquisition_jobs j
      INNER JOIN discovery_runs r ON r.id = j.run_id
      WHERE j.status = 'failed'
        AND j.updated_at >= NOW() - (${windowDays}::int * INTERVAL '1 day')
      ORDER BY j.updated_at DESC
      LIMIT ${rowLimit}
    `);

    const jobs: FailedJobRow[] = rows.map((row) => ({
      id: row.id,
      runId: row.run_id,
      stage: row.stage,
      errorMessage: row.error_message,
      attempts: row.attempts,
      failedAt: new Date(row.failed_at).toISOString(),
      run: {
        industry: row.industry,
        city: row.city,
        country: row.country,
        status: row.run_status,
      },
    }));

    return {
      days: windowDays,
      count: Number(countRow?.count ?? 0),
      jobs,
    };
  }
}
