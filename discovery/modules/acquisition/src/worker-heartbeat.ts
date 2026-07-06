import { acquisitionSettings, getDb } from '@agency/database';
import { eq } from 'drizzle-orm';

export const WORKER_HEARTBEAT_KEY = 'worker.heartbeat';

export type WorkerHeartbeat = {
  at: string;
  pid: number;
};

/** Default: worker considered offline if no heartbeat in 2 minutes. */
export const WORKER_HEARTBEAT_STALE_MS = 2 * 60 * 1000;

export async function touchWorkerHeartbeat(pid = process.pid): Promise<void> {
  const db = getDb();
  const value: WorkerHeartbeat = { at: new Date().toISOString(), pid };
  const existing = await db
    .select()
    .from(acquisitionSettings)
    .where(eq(acquisitionSettings.key, WORKER_HEARTBEAT_KEY))
    .limit(1);

  if (existing[0]) {
    await db
      .update(acquisitionSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(acquisitionSettings.key, WORKER_HEARTBEAT_KEY));
  } else {
    await db.insert(acquisitionSettings).values({
      key: WORKER_HEARTBEAT_KEY,
      value,
      updatedAt: new Date(),
    });
  }
}

export async function getWorkerHeartbeat(): Promise<WorkerHeartbeat | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(acquisitionSettings)
    .where(eq(acquisitionSettings.key, WORKER_HEARTBEAT_KEY))
    .limit(1);
  if (!row?.value) return null;
  const v = row.value as Partial<WorkerHeartbeat>;
  if (typeof v.at !== 'string') return null;
  return { at: v.at, pid: typeof v.pid === 'number' ? v.pid : 0 };
}

export function isWorkerHeartbeatStale(
  heartbeat: WorkerHeartbeat | null,
  staleMs = WORKER_HEARTBEAT_STALE_MS,
): boolean {
  if (!heartbeat?.at) return true;
  const at = new Date(heartbeat.at).getTime();
  if (Number.isNaN(at)) return true;
  return Date.now() - at > staleMs;
}
