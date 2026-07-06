import { discoveryRuns, getDb } from '@agency/database';
import { eq } from 'drizzle-orm';

export type PipelineLogLevel = 'info' | 'success' | 'error' | 'warn';

export type PipelineLogEntry = {
  at: string;
  level: PipelineLogLevel;
  stage?: string;
  message: string;
};

const MAX_LOG_ENTRIES = 400;

export async function appendPipelineLog(
  runId: string,
  entry: Omit<PipelineLogEntry, 'at'> & { at?: string },
): Promise<void> {
  const db = getDb();
  const [row] = await db.select().from(discoveryRuns).where(eq(discoveryRuns.id, runId)).limit(1);
  if (!row) return;

  const stats = (row.stats as Record<string, unknown> | null) ?? {};
  const prior = Array.isArray(stats.pipelineLog) ? (stats.pipelineLog as PipelineLogEntry[]) : [];

  const next: PipelineLogEntry = {
    at: entry.at ?? new Date().toISOString(),
    level: entry.level,
    stage: entry.stage,
    message: entry.message,
  };

  const pipelineLog = [...prior, next].slice(-MAX_LOG_ENTRIES);
  await db
    .update(discoveryRuns)
    .set({ stats: { ...stats, pipelineLog } })
    .where(eq(discoveryRuns.id, runId));
}

export async function listPipelineLogs(runId: string): Promise<PipelineLogEntry[]> {
  const db = getDb();
  const [row] = await db.select().from(discoveryRuns).where(eq(discoveryRuns.id, runId)).limit(1);
  const stats = (row?.stats as Record<string, unknown> | null) ?? {};
  return Array.isArray(stats.pipelineLog) ? (stats.pipelineLog as PipelineLogEntry[]) : [];
}

export async function setPipelinePlan(runId: string, plan: string[]): Promise<void> {
  const db = getDb();
  const [row] = await db.select().from(discoveryRuns).where(eq(discoveryRuns.id, runId)).limit(1);
  if (!row) return;
  const stats = (row.stats as Record<string, unknown> | null) ?? {};
  await db
    .update(discoveryRuns)
    .set({ stats: { ...stats, pipelinePlan: plan, pipelineLog: stats.pipelineLog ?? [] } })
    .where(eq(discoveryRuns.id, runId));
}

export async function getPipelinePlan(runId: string): Promise<string[]> {
  const db = getDb();
  const [row] = await db.select().from(discoveryRuns).where(eq(discoveryRuns.id, runId)).limit(1);
  const stats = (row?.stats as Record<string, unknown> | null) ?? {};
  return Array.isArray(stats.pipelinePlan) ? (stats.pipelinePlan as string[]) : [];
}
