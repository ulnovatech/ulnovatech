import { budgetLedger, getDb } from '@agency/database';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { BudgetProvider, SpendRecordInput } from './types';
import { getCapForProvider, periodStart } from './budget-config';

export class BudgetRepository {
  async sumUsage(provider: BudgetProvider, since: Date): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${budgetLedger.units}), 0)::int` })
      .from(budgetLedger)
      .where(and(eq(budgetLedger.provider, provider), gte(budgetLedger.createdAt, since)));
    return Number(row?.total ?? 0);
  }

  async insertSpend(input: SpendRecordInput): Promise<void> {
    const db = getDb();
    await db.insert(budgetLedger).values({
      provider: input.provider,
      operation: input.operation,
      units: input.units ?? 1,
      runId: input.runId ?? null,
      accountId: input.accountId ?? null,
    });
  }

  async getUsedInPeriod(provider: BudgetProvider): Promise<number> {
    const { period } = getCapForProvider(provider);
    return this.sumUsage(provider, periodStart(period));
  }
}
