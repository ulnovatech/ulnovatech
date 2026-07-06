import { canTransition } from '@agency/crm';
import { buildNormalizedKey } from '@agency/accounts';
import { getCapForProvider } from '@agency/acquisition';
import { buildDefaultPlatformSettings } from '@agency/settings';
import {
  accounts,
  integrationTestSkipMessage,
  INTEGRATION_TEST_COUNTRY,
  shouldRunIntegrationTests,
  closeDb,
  getDb,
} from '@agency/database';
import { eq } from 'drizzle-orm';

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
  assert(canTransition('NEW', 'CONTACTED') === true, 'funnel: NEW -> CONTACTED');
  assert(canTransition('CONTACTED', 'REPLIED') === true, 'funnel: CONTACTED -> REPLIED');
  assert(canTransition('REPLIED', 'QUALIFIED') === true, 'funnel: REPLIED -> QUALIFIED');
  assert(canTransition('QUALIFIED', 'PROPOSAL_SENT') === true, 'funnel: QUALIFIED -> PROPOSAL_SENT');
  assert(canTransition('PROPOSAL_SENT', 'CLOSED_WON') === true, 'funnel: PROPOSAL_SENT -> CLOSED_WON');

  const keyA = buildNormalizedKey({ name: 'Test Co', source: 'google_maps', externalId: 'ChIJ-test-1' });
  const keyB = buildNormalizedKey({ name: 'Test Co', source: 'google_maps', externalId: 'ChIJ-test-1' });
  const keyC = buildNormalizedKey({ name: 'Test Co', source: 'google_maps', externalId: 'ChIJ-test-2' });
  assert(keyA === keyB, 'account dedup: same external id normalizes identically');
  assert(keyA !== keyC, 'account dedup: different external id differs');

  const defaults = buildDefaultPlatformSettings();
  assert(defaults.acquisition.caps.google_places > 0, 'budget: places cap configured');
  assert(defaults.acquisition.caps.browser_automation > 0, 'budget: browser cap configured');
  assert(defaults.acquisition.caps.custom_scrape > 0, 'budget: custom scrape cap configured');
  assert(defaults.acquisition.caps.meta_graph > 0, 'budget: meta_graph cap configured');

  if (!shouldRunIntegrationTests()) {
    console.log(integrationTestSkipMessage('dashboard DB integration checks'));
    console.log(`${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
    return;
  }

  const { platformSettings } = await import('@agency/settings');
  await platformSettings.ensureLoaded();

  const { BudgetGovernor } = await import('@agency/acquisition');
  const { AccountService } = await import('@agency/accounts');

  const governor = new BudgetGovernor();
  const cap = getCapForProvider('custom_scrape').cap;
  const before = await governor.getProviderSummary('custom_scrape');
  const spendNeeded = before.remaining > 0 ? before.remaining : cap;
  for (let i = 0; i < spendNeeded; i++) {
    if (await governor.canSpend('custom_scrape', 1)) {
      await governor.recordSpend({ provider: 'custom_scrape', operation: 'integration_test', units: 1 });
    }
  }
  assert((await governor.canSpend('custom_scrape', 1)) === false, 'budget: custom_scrape blocks at cap');

  const accountService = new AccountService();
  const suffix = Date.now();
  let accountId: string | null = null;

  try {
    const first = await accountService.resolveOrCreate({
      name: `__integration__ Co ${suffix}`,
      source: 'public_search',
      externalId: `__integration__-${suffix}`,
      city: '__integration__city',
      country: INTEGRATION_TEST_COUNTRY,
    });
    accountId = first.account.id;

    const second = await accountService.resolveOrCreate({
      name: `__integration__ Co Renamed ${suffix}`,
      source: 'public_search',
      externalId: `__integration__-${suffix}`,
      city: '__integration__city',
      country: INTEGRATION_TEST_COUNTRY,
    });
    assert(first.account.id === second.account.id, 'account dedup: resolveOrCreate reuses account');
  } finally {
    if (accountId) {
      const db = getDb();
      await db.delete(accounts).where(eq(accounts.id, accountId));
    }
    await closeDb();
  }

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
