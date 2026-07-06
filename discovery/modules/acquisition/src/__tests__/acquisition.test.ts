import { budgetLedger, closeDb, discoveryRuns, getDb } from '@agency/database';
import {
  integrationDiscoveryRun,
  integrationTestSkipMessage,
  shouldRunIntegrationTests,
} from '@agency/database';
import { platformSettings } from '@agency/settings';
import { eq, inArray } from 'drizzle-orm';
import { BudgetGovernor } from '../budget-governor';
import { JobQueue } from '../job-queue';
import { getCapForProvider } from '../budget-config';
import { PIPELINE_JOB_STAGES } from '../types';

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

async function deleteRuns(db: ReturnType<typeof getDb>, runIds: string[]) {
  if (runIds.length === 0) return;
  await db.delete(discoveryRuns).where(inArray(discoveryRuns.id, runIds));
}

async function main() {
  if (!shouldRunIntegrationTests()) {
    console.log(integrationTestSkipMessage('acquisition integration tests'));
    process.exit(0);
  }

  const db = getDb();
  const runIds: string[] = [];

  try {
    await platformSettings.ensureLoaded();
    const current = platformSettings.getSync();
    await platformSettings.updateAcquisition({
      caps: { ...current.acquisition.caps, google_places: 5 },
    });
    platformSettings.invalidate();

    const governor = new BudgetGovernor();
    const cap = getCapForProvider('google_places').cap;

    const summaryBefore = await governor.getProviderSummary('google_places');
    const spendNeeded = summaryBefore.remaining > 0 ? summaryBefore.remaining : cap;

    for (let i = 0; i < spendNeeded; i++) {
      if (await governor.canSpend('google_places', 1)) {
        await governor.recordSpend({
          provider: 'google_places',
          operation: 'test_text_search',
          units: 1,
        });
      }
    }

    const canSpendAfterCap = await governor.canSpend('google_places', 1);
    assert(canSpendAfterCap === false, 'google_places canSpend false when monthly cap reached');

    const remaining = await governor.getRemaining('google_places');
    assert(remaining === 0, 'google_places remaining is 0 at cap');

    const summary = await governor.getSummary();
    assert(summary.length === 7, 'getSummary returns all 7 budget providers');

    const [run] = await db
      .insert(discoveryRuns)
      .values(integrationDiscoveryRun({ city: 'job_queue_city', industry: 'job_queue_industry' }))
      .returning();
    runIds.push(run.id);

    const queue = new JobQueue();
    const { id: jobId } = await queue.enqueue({
      runId: run.id,
      stage: 'discover',
      payload: { test: true },
    });
    assert(!!jobId, 'job enqueued');

    const claimed = await queue.claimForRun(run.id);
    assert(claimed?.id === jobId, 'job claimed');
    assert(claimed?.stage === 'discover', 'claimed job has correct stage');

    await queue.complete(jobId);
    const progress = await queue.getRunProgress(run.id);
    assert(progress.completed === 1, 'job completed');
    assert(progress.failed === 0, 'no failed jobs');

    const [run2] = await db
      .insert(discoveryRuns)
      .values(
        integrationDiscoveryRun({
          city: 'fail_job_city',
          industry: 'fail_job_industry',
        }),
      )
      .returning();
    runIds.push(run2.id);

    const { id: failJobId } = await queue.enqueue({
      runId: run2.id,
      stage: 'crawl',
      maxAttempts: 1,
    });
    const failClaimed = await queue.claimForRun(run2.id);
    assert(failClaimed?.id === failJobId, 'fail job claimed');
    const failResult = await queue.fail(failJobId, 'simulated crawl error');
    assert(failResult.status === 'failed', 'job failed after max attempts');

    const failProgress = await queue.getRunProgress(run2.id);
    assert(failProgress.failed === 1, 'failed job counted in progress');

    await governor.recordSpend({
      provider: 'google_places',
      operation: 'test_verify',
      units: 1,
      runId: run.id,
    });

    const ledgerRows = await db
      .select()
      .from(budgetLedger)
      .where(eq(budgetLedger.runId, run.id));
    assert(ledgerRows.length >= 1, 'budget_ledger records spend with runId');

    const [pipelineRun] = await db
      .insert(discoveryRuns)
      .values(
        integrationDiscoveryRun({
          city: 'pipeline_enqueue_city',
          industry: 'pipeline_enqueue_industry',
          runProfile: 'micro',
        }),
      )
      .returning();
    runIds.push(pipelineRun.id);

    await queue.enqueueStages(pipelineRun.id, PIPELINE_JOB_STAGES);
    const claimedForRun = await queue.claimForRun(pipelineRun.id);
    assert(claimedForRun?.stage === 'discover', 'claimForRun returns first pending stage');
    assert(PIPELINE_JOB_STAGES.length === 7, 'pipeline has seven stages');

    const browserCap = getCapForProvider('browser_automation').cap;
    const browserBefore = await governor.getProviderSummary('browser_automation');
    const browserSpendNeeded = browserBefore.remaining > 0 ? browserBefore.remaining : browserCap;
    for (let i = 0; i < browserSpendNeeded; i++) {
      if (await governor.canSpend('browser_automation', 1)) {
        await governor.recordSpend({
          provider: 'browser_automation',
          operation: 'test_session',
          units: 1,
        });
      }
    }
    const browserBlocked = await governor.canSpend('browser_automation', 1);
    assert(browserBlocked === false, 'browser_automation blocked at daily cap');
    const browserRemaining = await governor.getRemaining('browser_automation');
    assert(browserRemaining === 0, 'browser_automation remaining is 0 at cap');
  } finally {
    await deleteRuns(db, runIds);
    await closeDb();
  }

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
