import {
  appendPipelineLog,
  getNextPipelineStage,
  getPipelinePlan,
  getPipelineStagesForRun,
  JobQueue,
  JobRepository,
  setPipelinePlan,
  touchWorkerHeartbeat,
  type AcquisitionJobStage,
} from '@agency/acquisition';
import {
  inlinePipelineMaxSteps,
  inlinePipelineStaleJobMinutes,
  logger,
} from '@agency/config';
import { captureException } from '@agency/config/observability';
import {
  countHighPotentialEstimate,
  countProspectCandidates,
  DiscoveryService,
  DiscoveryRepository,
  GooglePlacesDetailsProvider,
  refreshRunYieldStats,
  type DiscoveredBusiness,
} from '@agency/discovery';
import { IntentService } from '@agency/intent';
import { IntelligenceService } from '@agency/intelligence';
import { QualificationService, uniqueBusinessIds } from '@agency/qualification';

const queue = new JobQueue();
const jobRepo = new JobRepository();
const discovery = new DiscoveryService();
const discoveryRepo = new DiscoveryRepository();
const intelligence = new IntelligenceService();
const intent = new IntentService();
const qualification = new QualificationService();
const placesDetails = new GooglePlacesDetailsProvider();

/** Prevent concurrent resumeRunPipeline for the same run (parallel polls abort mid-claim). */
const resumeLocks = new Map<string, Promise<{ steps: number }>>();

type ClaimedJob = {
  id: string;
  runId: string;
  stage: string;
  payload: Record<string, unknown> | null;
};

const STAGE_LABELS: Record<string, string> = {
  discover: 'Discover sources',
  resolve_accounts: 'Resolve accounts',
  crawl: 'Website crawl',
  bi_enrich: 'BI profile',
  derive_signals: 'Intent signals',
  score: 'Score leads',
  places_enrich: 'Places enrich',
  browser_enrich: 'Browser enrich',
};

async function logRun(
  runId: string,
  level: 'info' | 'success' | 'error' | 'warn',
  message: string,
  stage?: string,
) {
  await appendPipelineLog(runId, { level, message, stage });
}

function summarizeStagePayload(stage: string, payload: Record<string, unknown> | undefined): string {
  if (!payload) return 'Stage finished';
  switch (stage) {
    case 'discover': {
      const count = Array.isArray(payload.candidates) ? payload.candidates.length : 0;
      const candidates = Array.isArray(payload.candidates)
        ? (payload.candidates as DiscoveredBusiness[])
        : [];
      const stats = Array.isArray(payload.providerStats) ? payload.providerStats : [];
      const parts = stats.map(
        (s) => `${(s as { provider: string; count: number }).provider}: ${(s as { count: number }).count}`,
      );
      const prospect = countProspectCandidates(candidates);
      const highPotential = countHighPotentialEstimate(candidates);
      const prospectNote =
        prospect > 0 ? ` · ${prospect} prospect (${highPotential} high-potential)` : '';
      return `Discovered ${count} unique candidates${prospectNote}${parts.length ? ` (${parts.join(', ')})` : ''}`;
    }
    case 'resolve_accounts':
      return `Saved ${payload.businessCount ?? 0} businesses (${payload.suppressedSkipped ?? 0} suppressed)`;
    case 'crawl':
      return `Crawled ${payload.analyzed ?? 0} websites`;
    case 'bi_enrich':
      return `BI enriched ${payload.enriched ?? 0} accounts (avg completeness ${payload.averageCompleteness ?? 0}%)`;
    case 'derive_signals':
      return `Created ${payload.signalCount ?? 0} intent signals`;
    case 'score':
      return `Scored ${payload.scored ?? 0} businesses`;
    case 'browser_enrich': {
      const biRefresh = payload.biRefresh as { refreshed?: number } | undefined;
      const rescore = payload.rescore as { rescored?: number; scoreIncreased?: number } | undefined;
      const boiSynth = payload.boiSynth as { synthesized?: number } | undefined;
      const base = `Browser enriched ${payload.enriched ?? 0} / ${payload.attempted ?? 0} attempted`;
      const boiNote = boiSynth?.synthesized ? ` · BOI ${boiSynth.synthesized}` : '';
      if (rescore?.rescored) {
        return `${base} · BI refresh ${biRefresh?.refreshed ?? 0} · rescored ${rescore.rescored}${boiNote}`;
      }
      return `${base}${boiNote}`;
    }
    case 'places_enrich': {
      const reviewBi = payload.reviewBi as { patched?: number } | undefined;
      const rescore = payload.rescore as { rescored?: number; scoreIncreased?: number } | undefined;
      const boiSynth = payload.boiSynth as { synthesized?: number } | undefined;
      const rescoreNote = rescore?.rescored ? ` · rescored ${rescore.rescored}` : '';
      const boiNote = boiSynth?.synthesized ? ` · BOI ${boiSynth.synthesized}` : '';
      return `Places details ${payload.enriched ?? 0} enriched · review BI ${reviewBi?.patched ?? 0} · pain signals ${payload.reviewSignalsCreated ?? 0}${rescoreNote}${boiNote}`;
    }
    default:
      return 'Stage finished';
  }
}

async function getDiscoverCandidates(runId: string): Promise<DiscoveredBusiness[]> {
  const jobs = await jobRepo.findByRunId(runId);
  const discover = jobs.find((j) => j.stage === 'discover' && j.status === 'completed');
  if (!discover) throw new Error('Discover stage output missing');
  const payload = discover.payload as { candidates?: DiscoveredBusiness[] } | null;
  if (!payload?.candidates?.length) {
    throw new Error('Discover stage returned no candidates');
  }
  return payload.candidates;
}

async function executeStage(job: ClaimedJob): Promise<Record<string, unknown> | undefined> {
  const { runId, stage } = job;

  switch (stage) {
    case 'discover': {
      const { candidates, providerStats } = await discovery.executeDiscoverStage(runId);
      for (const stat of providerStats) {
        if (stat.error) {
          await logRun(runId, 'warn', `${stat.provider}: failed — ${stat.error}`, 'discover');
        } else {
          await logRun(runId, 'info', `${stat.provider}: ${stat.count} candidates`, 'discover');
        }
      }
      return { candidates, providerStats };
    }
    case 'resolve_accounts': {
      const candidates = await getDiscoverCandidates(runId);
      const result = await discovery.executeResolveAccountsStage(runId, candidates);
      return {
        businessCount: result.businesses.length,
        suppressedSkipped: result.suppressedSkipped,
        candidatesAfterVerify: result.candidatesAfterVerify,
      };
    }
    case 'crawl': {
      const result = await intelligence.analyzeRunBusinesses(runId);
      return result as unknown as Record<string, unknown>;
    }
    case 'bi_enrich': {
      const result = await intelligence.biEnrichRun(runId);
      logger.info('BI enrich step', { runId, ...result });
      return result as unknown as Record<string, unknown>;
    }
    case 'derive_signals': {
      const signals = await intent.deriveSignalsForRun(runId);
      return { signalCount: signals.length };
    }
    case 'score': {
      const result = await qualification.scoreRun(runId);
      return result as unknown as Record<string, unknown>;
    }
    case 'browser_enrich': {
      const result = await intelligence.browserEnrichRun(runId);
      logger.info('Browser enrich step', { runId, ...result });

      let biRefresh = { refreshed: 0, skipped: 0 };
      let rescore = { rescored: 0, scoreIncreased: 0 };
      let boiSynth = { synthesized: 0, skipped: 0 };
      const enrichedIds = result.enrichedBusinessIds ?? [];
      if (enrichedIds.length > 0) {
        biRefresh = await intelligence.biRefreshBusinesses(enrichedIds, runId);
        rescore = await qualification.rescoreBusinesses(runId, enrichedIds);
        boiSynth = await intelligence.synthesizeBoiForBusinesses(enrichedIds, runId);
        await logRun(
          runId,
          'info',
          `Post-browser refresh: BI ${biRefresh.refreshed} · rescored ${rescore.rescored} (${rescore.scoreIncreased} improved) · BOI ${boiSynth.synthesized}`,
          'browser_enrich',
        );
      }

      return {
        ...result,
        biRefresh,
        rescore,
        boiSynth,
      } as unknown as Record<string, unknown>;
    }
    case 'places_enrich': {
      const result = await placesDetails.enrichTopScoredForRun(runId);
      const reviewBi = await intelligence.patchPlacesReviewSignalsForRun(runId);
      const reviewSignals = await intent.deriveReviewPainSignalsForRun(runId);

      const uniqueRescoreIds = uniqueBusinessIds([
        ...(result.enrichedBusinessIds ?? []),
        ...reviewSignals.created
          .map((s) => s.businessId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ]);
      const rescore =
        uniqueRescoreIds.length > 0
          ? await qualification.rescoreBusinesses(runId, uniqueRescoreIds)
          : { rescored: 0, scoreIncreased: 0 };

      const boiIds = uniqueBusinessIds([
        ...uniqueRescoreIds,
        ...(result.enrichedBusinessIds ?? []),
      ]);
      const boiSynth =
        boiIds.length > 0
          ? await intelligence.synthesizeBoiForBusinesses(boiIds, runId)
          : { synthesized: 0, skipped: 0 };

      if (rescore.rescored > 0) {
        await logRun(
          runId,
          'info',
          `Post-places rescore: ${rescore.rescored} businesses (${rescore.scoreIncreased} improved) · BOI ${boiSynth.synthesized}`,
          'places_enrich',
        );
      }

      logger.info('Places details step', {
        runId,
        ...result,
        reviewBiPatched: reviewBi.patched,
        reviewSignalsCreated: reviewSignals.created.length,
        rescore,
        boiSynth,
      });
      return {
        ...result,
        reviewBi,
        reviewSignalsCreated: reviewSignals.created.length,
        reviewSignalsSkipped: reviewSignals.skipped,
        rescore,
        boiSynth,
      } as unknown as Record<string, unknown>;
    }
    default:
      throw new Error(`Unknown pipeline stage: ${stage}`);
  }
}

/** Strip `undefined` values so postgres jsonb inserts do not throw. */
function sanitizePayload(value: unknown): unknown {
  if (value === undefined) return null;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(sanitizePayload);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) out[k] = sanitizePayload(v);
  }
  return out;
}

async function markRunStarted(runId: string) {
  const run = await discoveryRepo.getRun(runId);
  if (run?.status === 'pending') {
    await discoveryRepo.updateRunStatus(runId, 'running', { startedAt: new Date(), errorMessage: null });
    await logRun(runId, 'info', `Pipeline started (${run.runProfile ?? 'standard'} profile${run.prospectFocus ? ', prospect focus' : ''})`);
  }
}

async function enqueueNextStage(runId: string, completedStage: AcquisitionJobStage) {
  const plan = await getPipelinePlan(runId);
  if (plan.length === 0) return;
  const next = getNextPipelineStage(completedStage, plan as AcquisitionJobStage[]);
  if (!next) {
    await logRun(runId, 'success', 'All pipeline stages complete');
    return;
  }
  await queue.enqueue({ runId, stage: next });
  await logRun(runId, 'info', `Queued ${STAGE_LABELS[next] ?? next}`, next);
}

async function isPlanComplete(runId: string): Promise<boolean> {
  const plan = await getPipelinePlan(runId);
  if (plan.length === 0) return false;
  const jobs = await jobRepo.findByRunId(runId);
  return plan.every((stage) =>
    jobs.some((j) => j.stage === stage && j.status === 'completed'),
  );
}

async function finalizeRun(runId: string) {
  const progress = await queue.getRunProgress(runId);
  const planComplete = await isPlanComplete(runId);

  if (progress.failed > 0) {
    const failedJob = progress.jobs.find((j) => j.status === 'failed');
    await discoveryRepo.updateRunStatus(runId, 'failed', {
      completedAt: new Date(),
      errorMessage: failedJob?.errorMessage ?? 'Pipeline stage failed',
    });
    await logRun(runId, 'error', failedJob?.errorMessage ?? 'Pipeline failed');
    try {
      await refreshRunYieldStats(runId);
    } catch (err) {
      logger.warn('Run yield stats refresh failed on failure', { runId, error: String(err) });
    }
    return;
  }

  if (planComplete) {
    await discoveryRepo.updateRunStatus(runId, 'completed', { completedAt: new Date() });
    await logRun(runId, 'success', 'Discovery run completed successfully');
    try {
      await refreshRunYieldStats(runId);
    } catch (err) {
      logger.warn('Run yield stats refresh failed on completion', { runId, error: String(err) });
    }
  }
}

/**
 * Advance the pipeline for a run. Safe to call from poll requests (inline dev mode).
 * Reclaims zombie jobs left when Next.js drops fire-and-forget async work.
 */
export async function resumeRunPipeline(
  runId: string,
  opts?: { maxSteps?: number; staleMinutes?: number },
): Promise<{ steps: number; skipped?: boolean }> {
  const inFlight = resumeLocks.get(runId);
  if (inFlight) {
    await inFlight.catch(() => {});
    return { steps: 0, skipped: true };
  }

  const work = (async () => {
    const staleMinutes = opts?.staleMinutes ?? inlinePipelineStaleJobMinutes();
    const maxSteps = opts?.maxSteps ?? inlinePipelineMaxSteps();

    await queue.reclaimStaleJobs(staleMinutes);
    await touchWorkerHeartbeat();

    let steps = 0;
    while (steps < maxSteps) {
      const job = await queue.claimForRun(runId);
      if (!job) break;
      await processClaimedJob(job);
      steps++;
    }

    return { steps };
  })();

  resumeLocks.set(runId, work);
  try {
    return await work;
  } finally {
    if (resumeLocks.get(runId) === work) {
      resumeLocks.delete(runId);
    }
  }
}

export async function processClaimedJob(job: ClaimedJob) {
  const stageLabel = STAGE_LABELS[job.stage] ?? job.stage;

  try {
    await markRunStarted(job.runId);
    await logRun(job.runId, 'info', `Starting ${stageLabel}…`, job.stage);

    const payload = await executeStage(job);
    await queue.complete(job.id, sanitizePayload(payload) as Record<string, unknown> | undefined);
    await logRun(job.runId, 'success', summarizeStagePayload(job.stage, payload), job.stage);

    await enqueueNextStage(job.runId, job.stage as AcquisitionJobStage);

    if (
      job.stage === 'discover' ||
      job.stage === 'resolve_accounts' ||
      job.stage === 'score' ||
      job.stage === 'places_enrich' ||
      job.stage === 'browser_enrich'
    ) {
      try {
        await refreshRunYieldStats(job.runId);
      } catch (err) {
        logger.warn('Run yield stats refresh failed mid-pipeline', {
          runId: job.runId,
          stage: job.stage,
          error: String(err),
        });
      }
    }
    await finalizeRun(job.runId);
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await logRun(job.runId, 'error', `${stageLabel} failed: ${message}`, job.stage);
      const result = await queue.fail(job.id, message);
      if (result.status === 'failed') {
        await discoveryRepo.updateRunStatus(job.runId, 'failed', {
          completedAt: new Date(),
          errorMessage: message,
        });
      }
    } catch (handlerErr) {
      logger.error('Pipeline failure handler error', {
        runId: job.runId,
        stage: job.stage,
        error: String(handlerErr),
      });
    }
    logger.error('Pipeline job failed', { runId: job.runId, stage: job.stage, error: message });
    captureException(err, { runId: job.runId, stage: job.stage, jobId: job.id });
    return { ok: false as const, error: message };
  }
}

export function isInlinePipelineEnabled() {
  return process.env.NODE_ENV === 'development' && process.env.INLINE_PIPELINE === 'true';
}

export async function drainRun(runId: string, maxSteps = 50) {
  let steps = 0;
  while (steps < maxSteps) {
    const job = await queue.claimForRun(runId);
    if (!job) break;
    await processClaimedJob(job);
    steps++;
  }
}

export async function drainOnce() {
  const job = await queue.claim();
  if (!job) return false;
  await processClaimedJob(job);
  return true;
}

export async function workerTick() {
  await queue.reclaimStaleJobs();
  await touchWorkerHeartbeat();
  return drainOnce();
}

export async function enqueueRunPipeline(runId: string) {
  const run = await discoveryRepo.getRun(runId);
  const profile = (run?.runProfile ?? 'standard') as 'micro' | 'standard' | 'boost';
  const stages = getPipelineStagesForRun(profile);
  await setPipelinePlan(runId, stages);
  await appendPipelineLog(runId, {
    level: 'info',
    message: `Pipeline plan: ${stages.map((s) => STAGE_LABELS[s] ?? s).join(' → ')}`,
  });
  const first = stages[0];
  if (!first) throw new Error('Pipeline has no stages');
  await queue.enqueue({ runId, stage: first });
  await logRun(runId, 'info', `Queued ${STAGE_LABELS[first] ?? first}`, first);
  return [{ id: runId, stage: first }];
}

export function kickRunWorker(runId: string) {
  if (!isInlinePipelineEnabled()) return;
  // Poll-driven resume on GET /api/acquisition/jobs handles inline mode reliably.
  // Fire-and-forget drain was dropped — Next.js kills it after the response is sent.
  void resumeRunPipeline(runId, { maxSteps: 1, staleMinutes: inlinePipelineStaleJobMinutes() }).catch(
    (err) => {
      logger.error('Inline pipeline kick failed', { runId, error: String(err) });
    },
  );
}
