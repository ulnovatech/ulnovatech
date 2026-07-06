import { closeDb, getDb, suppressionList } from '@agency/database';
import { AccountService } from '../service';
import { buildNormalizedKey } from '../normalize-key';

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
    console.log('skip accounts integration tests (DATABASE_URL not set)');
    process.exit(0);
  }

  const service = new AccountService();
  const suffix = Date.now();

  const input = {
    name: `Test Cafe ${suffix}`,
    source: 'google_maps' as const,
    externalId: `places-test-${suffix}`,
    city: 'Kampala',
    country: 'Uganda',
    industry: 'Restaurant',
    phone: '+256700000000',
  };

  const first = await service.resolveOrCreate(input);
  assert(first.created === true, 'resolveOrCreate creates new account');
  assert(!!first.account.id, 'account has id');

  const second = await service.resolveOrCreate(input);
  assert(second.created === false, 'resolveOrCreate reuses account');
  assert(second.account.id === first.account.id, 'same external_id maps to one account');
  assert(second.matchedBy === 'externalId', 'external id match reported');

  const phoneSuffix = Date.now();
  const phoneBase = {
    name: `Phone Cafe ${phoneSuffix}`,
    source: 'public_search' as const,
    city: 'Kampala',
    country: 'Uganda',
    phone: '+256712345678',
  };
  const phoneFirst = await service.resolveOrCreate({
    ...phoneBase,
    externalId: `phone-a-${phoneSuffix}`,
  });
  assert(phoneFirst.created === true, 'phone dedup: creates first account');
  const phoneSecond = await service.resolveOrCreate({
    ...phoneBase,
    name: `Phone Cafe Renamed ${phoneSuffix}`,
    externalId: `phone-b-${phoneSuffix}`,
    phone: '256712345678',
  });
  assert(phoneSecond.created === false, 'phone dedup: reuses by normalized phone');
  assert(phoneSecond.account.id === phoneFirst.account.id, 'phone dedup: same account id');
  assert(phoneSecond.matchedBy === 'phone', 'phone dedup: matchedBy phone');

  const domainSuffix = Date.now();
  const domainBase = {
    name: `Domain Legal ${domainSuffix}`,
    source: 'csv_import' as const,
    city: 'Nairobi',
    country: 'Kenya',
    website: `https://www.domain-legal-${domainSuffix}.example`,
  };
  const domainFirst = await service.resolveOrCreate(domainBase);
  assert(domainFirst.created === true, 'domain dedup: creates first account');
  const domainSecond = await service.resolveOrCreate({
    ...domainBase,
    name: `Domain Legal LLP ${domainSuffix}`,
    source: 'public_search',
    externalId: `domain-${domainSuffix}`,
    website: `http://domain-legal-${domainSuffix}.example/about`,
    phone: '+254700000001',
  });
  assert(domainSecond.created === false, 'domain dedup: reuses by website domain');
  assert(domainSecond.account.id === domainFirst.account.id, 'domain dedup: same account id');
  assert(domainSecond.matchedBy === 'domain', 'domain dedup: matchedBy domain');

  const key = buildNormalizedKey({
    name: input.name,
    source: input.source,
    externalId: input.externalId,
    city: input.city,
    country: input.country,
  });
  assert(key === `ext:google_maps:${input.externalId}`, 'normalized key uses external id');

  assert(service.shouldRefreshPlaces(second.account) === false, 'fresh account skips places refresh');
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 91);
  const stale = { ...second.account, lastPlacesFetchAt: oldDate };
  assert(service.shouldRefreshPlaces(stale) === true, 'stale account needs places refresh');
  assert(service.shouldSkipPlacesFetch(second.account) === true, 'shouldSkipPlacesFetch when fresh');

  await service.suppress(first.account.id, 'test');
  const suppressed = await service.getById(first.account.id);
  assert(suppressed?.suppressed === true, 'account suppress flag set');
  assert((await service.isSuppressed(suppressed!)) === true, 'isSuppressed true when flagged');

  const listInput = {
    name: `List Biz ${suffix}`,
    source: 'csv_import' as const,
    email: `blocked-${suffix}@example.com`,
    country: 'Uganda',
  };
  const listed = await service.resolveOrCreate(listInput);
  const db = getDb();
  await db.insert(suppressionList).values({
    email: `blocked-${suffix}@example.com`,
    reason: 'test suppression',
  });
  assert((await service.isSuppressed(listed.account)) === true, 'suppression list blocks account');

  await closeDb();
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
