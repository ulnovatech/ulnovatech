import { platformSettings } from '@agency/settings';
import type { MhSpendProvider } from './types';
import { MarketHunterRepository } from './repository';
import { DEFAULT_COST_ESTIMATES, getCostEstimates } from './research/llm.config';

/** @deprecated Use getCostEstimates() for settings-driven values. */
export const COST_ESTIMATES = {
  grokSearchCall: DEFAULT_COST_ESTIMATES.researchListingCallUsd,
  grokReviewsCall: DEFAULT_COST_ESTIMATES.researchReviewsCallUsd,
  claudeAnalysisCall: DEFAULT_COST_ESTIMATES.complaintAnalysisCallUsd,
} as const;

export { getCostEstimates };

export type MarketHunterSpendGuard = {
  canSpend(estimatedUsd: number): Promise<boolean>;
  recordSpend(input: {
    provider: MhSpendProvider;
    operation: string;
    costUsd: number;
    units?: number;
  }): Promise<void>;
  getCurrentSpendUsd(): Promise<number>;
};

export class MarketHunterBudgetGuard implements MarketHunterSpendGuard {
  constructor(
    private readonly scanId: string,
    private readonly repo: MarketHunterRepository = new MarketHunterRepository(),
  ) {}

  async getCurrentSpendUsd(): Promise<number> {
    return this.repo.getScanSpendTotal(this.scanId);
  }

  async canSpend(estimatedUsd: number): Promise<boolean> {
    await platformSettings.ensureLoaded();
    const max = platformSettings.getSync().marketHunter.maxSpendPerRunUsd;
    const current = await this.getCurrentSpendUsd();
    return current + estimatedUsd <= max;
  }

  async recordSpend(input: {
    provider: MhSpendProvider;
    operation: string;
    costUsd: number;
    units?: number;
  }): Promise<void> {
    await this.repo.recordSpend({
      scanId: this.scanId,
      provider: input.provider,
      operation: input.operation,
      costUsd: input.costUsd,
      units: input.units ?? 1,
    });
  }
}
