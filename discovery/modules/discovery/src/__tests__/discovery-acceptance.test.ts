/**
 * Phase 5 discovery acceptance harness (P5-D13).
 * Fast static checks always run; DB checks run when DATABASE_URL is set.
 */
import fs from 'fs';
import path from 'path';
import {
  getPipelineStagesForRun,
  JobQueue,
  PIPELINE_JOB_STAGES,
  setPipelinePlan,
} from '@agency/acquisition';
import { closeDb, discoveryRuns, getDb } from '@agency/database';
import {
  integrationDiscoveryRun,
  integrationTestSkipMessage,
  shouldRunIntegrationTests,
} from '@agency/database';
import { eq } from 'drizzle-orm';
import { buildDefaultPlatformSettings } from '@agency/settings';
import {
  buildBusinessSignalsFromReviews,
  getConfiguredDiscoveryProviders,
  getDiscoveryProviderStatus,
  reviewPainSourceUrl,
} from '../index';

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

const discoveryRoot = path.join(process.cwd(), 'src');
const repoRoot = path.resolve(process.cwd(), '../..');
const workerPath = path.join(repoRoot, 'apps/dashboard/src/lib/job-worker.ts');
const registryPath = path.join(discoveryRoot, 'providers/registry.ts');

// --- Stub policy ---
assert(!fs.existsSync(path.join(discoveryRoot, 'providers/planned.ts')), 'planned.ts removed');

const forbidden = ['not implemented yet', 'PlannedProvider', 'PLANNED_PROVIDERS'];
for (const phrase of forbidden) {
  assert(!fs.readFileSync(registryPath, 'utf-8').includes(phrase), `registry has no "${phrase}"`);
}

// --- Pipeline contract (Phase 5) ---
const expectedStages = [
  'discover',
  'resolve_accounts',
  'crawl',
  'bi_enrich',
  'derive_signals',
  'score',
  'places_enrich',
] as const;

assert(
  PIPELINE_JOB_STAGES.length === expectedStages.length,
  `pipeline has ${expectedStages.length} base stages`,
);
for (let i = 0; i < expectedStages.length; i++) {
  assert(PIPELINE_JOB_STAGES[i] === expectedStages[i], `pipeline stage ${i + 1} is ${expectedStages[i]}`);
}

const standard = getPipelineStagesForRun('standard', false);
assert(standard.length === 7, 'standard run has seven stages');
assert(!standard.includes('browser_enrich'), 'standard excludes browser_enrich');

const boostBrowser = getPipelineStagesForRun('boost', true);
assert(boostBrowser.includes('browser_enrich'), 'boost with browser includes browser_enrich');
assert(boostBrowser.length === 8, 'boost with browser has eight stages');
assert(
  boostBrowser.indexOf('browser_enrich') === boostBrowser.indexOf('score') + 1,
  'browser_enrich immediately after score',
);
assert(
  boostBrowser.indexOf('places_enrich') === boostBrowser.indexOf('browser_enrich') + 1,
  'places_enrich after browser_enrich',
);

// --- Discover registry order ---
const registrySource = fs.readFileSync(registryPath, 'utf-8');
const registryFn = registrySource.slice(
  registrySource.indexOf('export async function getConfiguredDiscoveryProviders'),
);
const providerPushOrder = [
  'placesDiscover',
  'searchProvider',
  'metaProvider',
  'socialProvider',
  'csvProvider',
];
let lastPushIdx = -1;
for (const provider of providerPushOrder) {
  const idx = registryFn.indexOf(`ordered.push(${provider})`);
  assert(idx > lastPushIdx, `registry pushes ${provider} in charter order`);
  lastPushIdx = idx;
}

// --- places_enrich post-hooks (review pain graceful path) ---
const workerSource = fs.readFileSync(workerPath, 'utf-8');
assert(workerSource.includes("case 'places_enrich'"), 'job worker handles places_enrich');
assert(
  workerSource.includes('patchPlacesReviewSignalsForRun'),
  'places_enrich patches BI review signals',
);
assert(
  workerSource.includes('deriveReviewPainSignalsForRun'),
  'places_enrich derives review pain intent signals',
);
assert(
  workerSource.includes('rescoreBusinesses'),
  'places_enrich triggers post-places rescore',
);
assert(
  workerSource.includes('biRefreshBusinesses'),
  'browser_enrich triggers BI refresh after contacts',
);
assert(
  workerSource.includes('synthesizeBoiForBusinesses'),
  'pipeline re-synthesizes BOI after late enrichment',
);
assert(
  workerSource.includes('enqueueRunPipeline'),
  'job worker exposes sequential enqueueRunPipeline',
);
assert(workerSource.includes('appendPipelineLog'), 'job worker writes pipeline log');
assert(workerSource.includes('enqueueNextStage'), 'job worker chains stages sequentially');

// --- Budget + settings defaults ---
const defaults = buildDefaultPlatformSettings();
assert(defaults.acquisition.caps.google_places > 0, 'default google_places cap');
assert(defaults.acquisition.caps.meta_graph > 0, 'default meta_graph cap');
assert(defaults.acquisition.places != null, 'default places run settings');

// --- Review pain exports ---
const pain = buildBusinessSignalsFromReviews([
  { text: 'Great food but no website', rating: 3 },
]);
assert(pain.painKeywords.some((p) => p.keyword === 'no_website'), 'review pain mining exported');
assert(
  reviewPainSourceUrl('biz-x', 'no_website') === 'places_review_pain:biz-x:no_website',
  'review pain dedupe key stable',
);

async function runDbChecks() {
  if (!shouldRunIntegrationTests()) {
    console.log(integrationTestSkipMessage('discovery acceptance DB checks'));
    return;
  }

  const statuses = await getDiscoveryProviderStatus();
  const statusNames = statuses.map((s) => s.name);
  for (const name of ['google_maps', 'public_search', 'facebook', 'social_search', 'csv_import']) {
    assert(statusNames.includes(name), `provider status includes ${name}`);
  }

  const providers = await getConfiguredDiscoveryProviders('standard');
  assert(Array.isArray(providers), 'getConfiguredDiscoveryProviders returns array');

  const db = getDb();
  let runId: string | null = null;

  try {
    const [run] = await db
      .insert(discoveryRuns)
      .values(
        integrationDiscoveryRun({
          city: 'acceptance_pipeline_city',
          industry: 'acceptance_pipeline_industry',
          runProfile: 'standard',
        }),
      )
      .returning();
    runId = run.id;

    const queue = new JobQueue();
    const stages = getPipelineStagesForRun('standard');
    await setPipelinePlan(run.id, stages);
    await queue.enqueue({ runId: run.id, stage: stages[0]! });
    const progress = await queue.getRunProgress(run.id);
    assert(progress.total === 1, 'sequential pipeline enqueues first stage only');
    assert(progress.jobs[0]?.stage === 'discover', 'first job is discover');
    assert(stages.indexOf('bi_enrich') < stages.indexOf('derive_signals'), 'bi_enrich before derive_signals');
    assert(stages.indexOf('derive_signals') < stages.indexOf('score'), 'derive_signals before score');
    assert(stages.indexOf('score') < stages.indexOf('places_enrich'), 'score before places_enrich');
  } finally {
    if (runId) {
      await db.delete(discoveryRuns).where(eq(discoveryRuns.id, runId));
    }
    await closeDb();
  }
}

async function main() {
  await runDbChecks();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
