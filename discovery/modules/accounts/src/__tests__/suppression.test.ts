import { closeDb } from '@agency/database';
import { normalizeSuppressionInput, SuppressionService } from '../suppression-service';
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
  assert(normalizeSuppressionInput({ email: 'Test@Example.COM' }).email === 'test@example.com', 'normalize email');
  assert(normalizeSuppressionInput({ phone: '+256 700 111 222' }).phone === '256700111222', 'normalize phone');
  assert(normalizeSuppressionInput({ domain: 'https://www.blocked.com/path' }).domain === 'blocked.com', 'normalize domain');

  if (!process.env.DATABASE_URL) {
    console.log('skip suppression integration tests (DATABASE_URL not set)');
    console.log(`${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
    return;
  }

  const accounts = new AccountService();
  const suppression = new SuppressionService();
  const suffix = Date.now();
  const blockedEmail = `blocked-${suffix}@example.com`;

  const entry = await suppression.add({
    email: blockedEmail,
    reason: 'integration test',
  });
  assert(!!entry.id, 'suppression: add entry');

  const listed = await suppression.list();
  assert(listed.some((row) => row.id === entry.id), 'suppression: list contains entry');

  const account = await accounts.resolveOrCreate({
    name: `Suppression Test ${suffix}`,
    source: 'csv_import',
    email: blockedEmail,
    country: 'Uganda',
  });
  const status = await suppression.getStatus(account.account);
  assert(status.suppressed === true && status.source === 'list', 'suppression: account matches list');

  await suppression.remove(entry.id);
  const afterRemove = await suppression.getStatus(account.account);
  assert(afterRemove.suppressed === false, 'suppression: eligible after remove');

  await closeDb();
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
