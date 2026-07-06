import type { SpendRecordInput } from './types';

/**
 * Contract for acquisition providers (Chunks C3–C5, C12–C13).
 * Every paid or quota-limited external call MUST go through BudgetGovernor.
 */
export interface IBudgetGovernor {
  canSpend(provider: SpendRecordInput['provider'], units?: number): Promise<boolean>;
  recordSpend(input: SpendRecordInput): Promise<void>;
}

/**
 * Contract for pipeline worker (Chunk C6).
 * C1 implements enqueue/claim/complete/fail; worker implementation is future.
 */
export interface IJobQueue {
  enqueue(input: {
    runId: string;
    stage: string;
    payload?: Record<string, unknown>;
    maxAttempts?: number;
  }): Promise<{ id: string }>;
  claim(): Promise<{ id: string; runId: string; stage: string; payload: Record<string, unknown> | null } | null>;
  complete(jobId: string): Promise<void>;
  fail(
    jobId: string,
    error: string,
  ): Promise<{ status: 'pending' | 'failed'; requeued: boolean }>;
}

/**
 * Helper for provider adapters — call before external API request.
 * Chunk C4 (Google Places) will use this pattern:
 *
 *   if (!(await governor.assertCanSpend('google_places', 1))) throw new BudgetExhaustedError();
 *   const result = await placesApi.search(...);
 *   await governor.recordSpend({ provider: 'google_places', operation: 'text_search', runId });
 */
export class BudgetExhaustedError extends Error {
  constructor(public readonly provider: string) {
    super(`Budget exhausted for provider: ${provider}`);
    this.name = 'BudgetExhaustedError';
  }
}
