import { platformSettings } from '@agency/settings';
import { BudgetExhaustedError, type IBudgetGovernor } from './contracts';
import { BudgetRepository } from './budget-repository';
import { getBudgetCaps, getCapForProvider } from './budget-config';
import type { BudgetProvider, BudgetProviderSummary, SpendRecordInput } from './types';

export class BudgetGovernor implements IBudgetGovernor {
  private repo = new BudgetRepository();

  async canSpend(provider: BudgetProvider, units = 1): Promise<boolean> {
    await platformSettings.ensureLoaded();
    const { cap } = getCapForProvider(provider);
    const used = await this.repo.getUsedInPeriod(provider);
    return used + units <= cap;
  }

  async assertCanSpend(provider: BudgetProvider, units = 1): Promise<void> {
    if (!(await this.canSpend(provider, units))) {
      throw new BudgetExhaustedError(provider);
    }
  }

  async recordSpend(input: SpendRecordInput): Promise<void> {
    await this.repo.insertSpend(input);
  }

  /**
   * Check budget and record spend atomically (for provider adapters in future chunks).
   */
  async spend(input: SpendRecordInput): Promise<void> {
    const units = input.units ?? 1;
    await this.assertCanSpend(input.provider, units);
    await this.recordSpend(input);
  }

  async getRemaining(provider: BudgetProvider): Promise<number> {
    await platformSettings.ensureLoaded();
    const { cap } = getCapForProvider(provider);
    const used = await this.repo.getUsedInPeriod(provider);
    return Math.max(0, cap - used);
  }

  async getProviderSummary(provider: BudgetProvider): Promise<BudgetProviderSummary> {
    await platformSettings.ensureLoaded();
    const config = getCapForProvider(provider);
    const used = await this.repo.getUsedInPeriod(provider);
    const remaining = Math.max(0, config.cap - used);
    return {
      provider,
      period: config.period,
      cap: config.cap,
      used,
      remaining,
      canSpend: remaining > 0,
    };
  }

  async getSummary(): Promise<BudgetProviderSummary[]> {
    const caps = getBudgetCaps();
    return Promise.all(caps.map((c) => this.getProviderSummary(c.provider)));
  }
}
