import { accounts as accountsTable, businesses, discoveryRuns, getDb, leads } from '@agency/database';
import { eq } from 'drizzle-orm';
import { AccountMergeError, AccountMergeService } from '../merge-service';
import { AccountService } from '../service';

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
  if (!process.env.DATABASE_URL) {
    console.log('skip merge integration tests (DATABASE_URL not set)');
    process.exit(0);
  }

  const accounts = new AccountService();
  const merge = new AccountMergeService();
  const db = getDb();
  const suffix = Date.now();

  const left = await accounts.resolveOrCreate({
    name: `Merge Left ${suffix}`,
    source: 'csv_import',
    city: 'Kampala',
    country: 'Uganda',
    website: `https://merge-left-${suffix}.example`,
    phone: '+256799000111',
  });
  const right = await accounts.resolveOrCreate({
    name: `Merge Right ${suffix}`,
    source: 'public_search',
    externalId: `merge-right-${suffix}`,
    city: 'Kampala',
    country: 'Uganda',
  });
  await db
    .update(accountsTable)
    .set({ phone: '256799000111' })
    .where(eq(accountsTable.id, right.account.id));
  assert(left.created && right.created, 'merge: seed two accounts');
  assert(left.account.id !== right.account.id, 'merge: distinct accounts before merge');

  const candidates = await merge.findDuplicateCandidates(left.account.id);
  assert(
    candidates.some((c) => c.accountId === right.account.id && c.matchKind === 'phone'),
    'merge: phone duplicate candidate found',
  );

  await merge.mergeAccounts(left.account.id, right.account.id, 'test-operator', ['phone']);
  assert((await accounts.getById(left.account.id)) !== null, 'merge: survivor kept');
  assert((await accounts.getById(right.account.id)) === null, 'merge: merged account deleted');

  const rediscover = await accounts.resolveOrCreate({
    name: `Merge Right Again ${suffix}`,
    source: 'manual',
    phone: '+256799000111',
    city: 'Kampala',
    country: 'Uganda',
  });
  assert(rediscover.created === false, 'merge: phone resolves to survivor');
  assert(rediscover.account.id === left.account.id, 'merge: survivor receives phone dedup');

  let conflictThrown = false;
  const conflictSuffix = Date.now();
  const accountA = await accounts.resolveOrCreate({
    name: `Conflict A ${conflictSuffix}`,
    source: 'csv_import',
    city: 'Nairobi',
    country: 'Kenya',
    externalId: `conflict-a-${conflictSuffix}`,
  });
  const accountB = await accounts.resolveOrCreate({
    name: `Conflict B ${conflictSuffix}`,
    source: 'csv_import',
    city: 'Nairobi',
    country: 'Kenya',
    externalId: `conflict-b-${conflictSuffix}`,
    phone: '+254711000222',
  });

  const [run] = await db
    .insert(discoveryRuns)
    .values({
      country: 'Kenya',
      city: 'Nairobi',
      industry: 'Retail',
      status: 'completed',
      runProfile: 'micro',
    })
    .returning();

  const [bizA] = await db
    .insert(businesses)
    .values({
      discoveryRunId: run.id,
      accountId: accountA.account.id,
      name: accountA.account.canonicalName,
      source: 'manual',
      city: 'Nairobi',
      country: 'Kenya',
    })
    .returning();
  const [bizB] = await db
    .insert(businesses)
    .values({
      discoveryRunId: run.id,
      accountId: accountB.account.id,
      name: accountB.account.canonicalName,
      source: 'manual',
      city: 'Nairobi',
      country: 'Kenya',
    })
    .returning();

  await db.insert(leads).values({
    accountId: accountA.account.id,
    businessId: bizA.id,
    status: 'NEW',
    owner: 'operator',
  });
  await db.insert(leads).values({
    accountId: accountB.account.id,
    businessId: bizB.id,
    status: 'CONTACTED',
    owner: 'operator',
  });

  try {
    await merge.mergeAccounts(accountA.account.id, accountB.account.id);
  } catch (e) {
    conflictThrown = e instanceof AccountMergeError && e.code === 'ACTIVE_LEAD_CONFLICT';
  }
  assert(conflictThrown, 'merge: blocks when both accounts have active leads');

  const { closeDb } = await import('@agency/database');
  await closeDb();
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
