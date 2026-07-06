import { platformSettings } from '@agency/settings';
import { buildPublicSearchQueries } from '../lib/build-public-search-queries';
import { getRunSearchQueryLimit, googleMapsEnabledInMode } from '../lib/run-profile';
import { parseSearchResultItem } from '../providers/parse-search-results';
import { getConfiguredDiscoveryProviders } from '../providers/registry';

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
    console.log('skip discovery settings integration tests (DATABASE_URL not set)');
    process.exit(0);
  }

  await platformSettings.ensureLoaded();
  await platformSettings.updateAcquisition({ mode: 'economy' });
  assert(getRunSearchQueryLimit() === 5, 'economy run search limit is 5');
  assert(googleMapsEnabledInMode() === false, 'google maps disabled in economy');

  const economyProviders = await getConfiguredDiscoveryProviders();
  assert(!economyProviders.some((p) => p.name === 'google_maps'), 'discover chain excludes google_maps fan-out');

  await platformSettings.updateAcquisition({ mode: 'standard' });
  assert(getRunSearchQueryLimit() === 15, 'standard run search limit is 15');

  const standardProviders = await getConfiguredDiscoveryProviders('standard');
  const hasPlacesFirst =
    standardProviders.length > 0 && standardProviders[0].name === 'google_maps';
  if (await platformSettings.isPlacesConfigured()) {
    assert(hasPlacesFirst, 'standard discover chain leads with google_maps when Places configured');
  } else {
    console.log('skip places-first assertion (Places key not configured)');
  }

  const queries = buildPublicSearchQueries(
    { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' },
    5,
  );
  assert(queries.length <= 5, 'buildPublicSearchQueries respects max');
  assert(queries[0].includes('Restaurant'), 'first query includes industry');
  assert(
    queries.some((q) => q.includes('site:facebook.com')),
    'public search includes prospect facebook queries',
  );

  const parsed = parseSearchResultItem(
    {
      title: "Joe's Kitchen - Kampala | Facebook",
      link: 'https://www.facebook.com/joeskitchen',
      snippet: 'Local restaurant',
    },
    { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' },
    'test query',
  );
  assert(parsed?.source === 'public_search', 'parsed source is public_search');
  assert(parsed?.facebookUrl?.includes('facebook.com') === true, 'facebook link detected');
  assert(parsed?.externalId?.startsWith('search:') === true, 'external id prefixed');

  const skipped = parseSearchResultItem(
    { title: 'Wiki', link: 'https://en.wikipedia.org/wiki/Food', snippet: '' },
    { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' },
    'q',
  );
  assert(skipped === null, 'skips wikipedia results');

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
