import { closeDb, discoveryRuns, getDb } from '@agency/database';
import {
  integrationDiscoveryRun,
  integrationTestSkipMessage,
  shouldRunIntegrationTests,
} from '@agency/database';
import { eq, inArray } from 'drizzle-orm';
import { acquisitionJobs } from '@agency/database';
import { JobQueue } from '../job-queue';
import { JobRepository } from '../job-repository';
import { touchWorkerHeartbeat, getWorkerHeartbeat } from '../worker-heartbeat';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`ok ${name}`);
  } else {
    failed++;
    console.error(`fail ${name}`);
  }
}

async function main() {
  if (!shouldRunIntegrationTests()) {
    console.log(integrationTestSkipMessage('job reclaim integration tests'));
    process.exit(0);
  }

  const queue = new JobQueue();
  const repo = new JobRepository();
  const db = getDb();
  let runId: string | null = null;

  try {
    const [run] = await db
      .insert(discoveryRuns)
      .values(integrationDiscoveryRun({ city: 'reclaim_city', industry: 'reclaim_industry' }))
      .returning();
    runId = run.id;

    const { id: jobId } = await queue.enqueue({ runId: run.id, stage: 'discover' });
    await db
      .update(acquisitionJobs)
      .set({
        status: 'running',
        claimedAt: new Date(Date.now() - 20 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(acquisitionJobs.id, jobId));

    const reclaimed = await queue.reclaimStaleJobs(15);
    assert(reclaimed === 1, 'reclaimStaleJobs resets one stale running job');

    const after = await repo.findById(jobId);
    assert(after?.status === 'pending', 'stale job back to pending');
    assert(after?.claimedAt === null, 'stale job claimedAt cleared');

    const claimed = await queue.claimForRun(run.id);
    assert(claimed?.id === jobId, 'reclaimed job can be claimed again');

    await touchWorkerHeartbeat(99999);
    const heartbeat = await getWorkerHeartbeat();
    assert(heartbeat?.pid === 99999, 'worker heartbeat records pid');
    assert(!!heartbeat?.at, 'worker heartbeat records timestamp');
  } finally {
    if (runId) {
      await db.delete(discoveryRuns).where(inArray(discoveryRuns.id, [runId]));
    }
    await closeDb();
  }

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
