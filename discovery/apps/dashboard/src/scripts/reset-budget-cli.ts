import { loadRootEnv } from '@agency/config/load-env';
import { BudgetGovernor } from '@agency/acquisition';
import { budgetLedger, closeDb, getDb } from '@agency/database';

loadRootEnv();

async function main() {
  const db = getDb();
  const deleted = await db.delete(budgetLedger).returning({ id: budgetLedger.id });
  console.log(`Cleared ${deleted.length} budget ledger row(s).`);

  const governor = new BudgetGovernor();
  const summary = await governor.getSummary();
  for (const row of summary) {
    console.log(`  ${row.provider}: ${row.remaining}/${row.cap} remaining`);
  }

  await closeDb();
  console.log('Budget counters reset — discovery API quotas are available again.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
