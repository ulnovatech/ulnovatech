import { acquisitionJobs, closeDb, discoveryRuns, getDb } from '@agency/database';
import {
  integrationDiscoveryRun,
  integrationTestSkipMessage,
  shouldRunIntegrationTests,
} from '@agency/database';
import { eq } from 'drizzle-orm';
import { JobQueue } from '../job-queue';
import { JobRepository } from '../job-repository';

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
    console.log(integrationTestSkipMessage('job retry integration tests'));
    process.exit(0);
  }

  const queue = new JobQueue();
  const repo = new JobRepository();
  const db = getDb();
  let runId: string | null = null;

  try {
    const [run] = await db
      .insert(discoveryRuns)
      .values(
        integrationDiscoveryRun({
          city: 'retry_city',
          industry: 'retry_industry',
          status: 'failed',
        }),
      )
      .returning();
    runId = run.id;

    const discover = await queue.enqueue({ runId: run.id, stage: 'discover' });
    const crawl = await queue.enqueue({ runId: run.id, stage: 'crawl' });

    await repo.updateStatus(discover.id, 'completed', {
      completedAt: new Date(),
      payload: { candidates: [{ name: 'Acme' }] },
    });

    await repo.updateStatus(crawl.id, 'failed', {
      errorMessage: 'Crawl timeout',
      completedAt: new Date(),
      payload: { lastError: { message: 'Crawl timeout', at: new Date().toISOString() } },
    });

    const before = await queue.getRunProgress(run.id);
    assert(before.completed === 1, 'discover stays completed before retry');
    assert(before.failed === 1, 'crawl failed before retry');

    const retry = await queue.retryFromFailedStage(run.id);
    assert(retry?.stage === 'crawl', 'retry targets failed crawl stage');

    const after = await queue.getRunProgress(run.id);
    const crawlJob = after.jobs.find((j) => j.stage === 'crawl');
    assert(crawlJob?.status === 'pending', 'crawl job pending after retry');
    assert(crawlJob?.attempts === 0, 'crawl attempts reset');
    assert(crawlJob?.errorMessage === null, 'crawl error cleared');
    assert(
      after.jobs.find((j) => j.stage === 'discover')?.status === 'completed',
      'discover still completed after retry',
    );

    const claimed = await queue.claimForRun(run.id);
    assert(claimed?.stage === 'crawl', 'next claim resumes crawl not discover');
  } finally {
    if (runId) {
      await db.delete(acquisitionJobs).where(eq(acquisitionJobs.runId, runId));
      await db.delete(discoveryRuns).where(eq(discoveryRuns.id, runId));
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
