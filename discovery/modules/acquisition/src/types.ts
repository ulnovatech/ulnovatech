/** Budget providers — each maps to a paid or quota-limited acquisition channel */
export type BudgetProvider =
  | 'google_places'
  | 'google_cse'
  | 'bing_search'
  | 'browser_automation'
  | 'custom_scrape'
  | 'meta_graph'
  | 'llm_narrative';

export type BudgetPeriod = 'monthly' | 'daily';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

/**
 * Pipeline stages — consumed by JobQueue (Chunk C6 worker).
 * C1 defines storage and enqueue only.
 */
export type AcquisitionJobStage =
  | 'discover'
  | 'resolve_accounts'
  | 'crawl'
  | 'bi_enrich'
  | 'derive_signals'
  | 'score'
  | 'places_enrich'
  | 'browser_enrich';

export const PIPELINE_JOB_STAGES: AcquisitionJobStage[] = [
  'discover',
  'resolve_accounts',
  'crawl',
  'bi_enrich',
  'derive_signals',
  'score',
  'places_enrich',
];

export interface BudgetCapConfig {
  provider: BudgetProvider;
  period: BudgetPeriod;
  cap: number;
}

export interface SpendRecordInput {
  provider: BudgetProvider;
  operation: string;
  units?: number;
  runId?: string;
  /** Reserved for Chunk C2 canonical accounts */
  accountId?: string;
}

export interface BudgetProviderSummary {
  provider: BudgetProvider;
  period: BudgetPeriod;
  cap: number;
  used: number;
  remaining: number;
  canSpend: boolean;
}

export interface RunProgress {
  runId: string;
  total: number;
  completed: number;
  failed: number;
  pending: number;
  running: number;
  currentStage: AcquisitionJobStage | null;
  plannedStages?: AcquisitionJobStage[];
  pipelineLog?: Array<{
    at: string;
    level: 'info' | 'success' | 'error' | 'warn';
    stage?: string;
    message: string;
  }>;
  jobs: Array<{
    id: string;
    stage: string;
    status: JobStatus | 'waiting' | 'queued';
    attempts: number;
    errorMessage: string | null;
    claimedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    durationMs: number | null;
    lastError: { message: string; at: string } | null;
  }>;
}

export type JobLastError = { message: string; at: string };
