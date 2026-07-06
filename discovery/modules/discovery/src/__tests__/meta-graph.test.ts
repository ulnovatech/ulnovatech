import { platformSettings } from '@agency/settings';
import { buildMetaSearchQueries } from '../lib/build-meta-search-queries';
import { getMetaGraphPagesPerQuery } from '../lib/run-profile';
import {
  mapMetaPageToDiscoveredBusiness,
  mapMetaPlaceToDiscoveredBusiness,
} from '../providers/meta/map-meta-result';
import { MetaGraphDiscoveryProvider } from '../providers/meta/meta-graph-provider';

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

const params = { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' };

const pageMapped = mapMetaPageToDiscoveredBusiness(
  {
    id: '123456',
    name: 'Kampala Kitchen',
    link: 'https://www.facebook.com/kampalakitchen',
    phone: '+256700111222',
    website: 'https://kampalakitchen.example',
    category: 'Restaurant',
    fan_count: 1200,
    location: { city: 'Kampala', country: 'Uganda' },
    instagram_business_account: {
      id: 'ig-999',
      username: 'kampalakitchen',
      name: 'Kampala Kitchen IG',
    },
  },
  params,
  'Restaurant Kampala',
);

assert(pageMapped.length === 2, 'page with IG yields facebook + instagram rows');
assert(pageMapped[0]?.source === 'facebook', 'first row is facebook source');
assert(pageMapped[0]?.externalId === 'meta:page:123456', 'facebook externalId format');
assert(pageMapped[1]?.source === 'instagram', 'second row is instagram source');
assert(pageMapped[1]?.externalId === 'meta:ig:ig-999', 'instagram externalId format');
assert(
  pageMapped[0]?.instagramUrl === 'https://www.instagram.com/kampalakitchen/',
  'instagram URL from username',
);

const placeMapped = mapMetaPlaceToDiscoveredBusiness(
  {
    id: 'place-42',
    name: 'City Spa',
    link: 'https://www.facebook.com/cityspa',
    location: { city: 'Kampala', country: 'Uganda' },
    category: 'Spa',
  },
  params,
  'Spa Kampala',
);

assert(placeMapped?.source === 'facebook', 'place maps to facebook source');
assert(placeMapped?.externalId === 'meta:place:place-42', 'place externalId format');

const queries = buildMetaSearchQueries(params, 5);
assert(queries.length >= 2, 'builds multiple meta queries');
assert(queries[0].includes('Restaurant'), 'query includes industry');

assert(getMetaGraphPagesPerQuery('standard') === 1, 'standard meta pages per query');
assert(getMetaGraphPagesPerQuery('boost') === 2, 'boost meta pages per query');

async function testDiscoverWithMockedClient() {
  if (!process.env.DATABASE_URL) {
    console.log('skip meta graph discover test (DATABASE_URL not set)');
    return;
  }

  await platformSettings.ensureLoaded();
  const provider = new MetaGraphDiscoveryProvider();
  provider.isConfigured = async () => true;

  const client = (provider as unknown as { client: { searchPages: Function; searchPlaces: Function } })
    .client;

  client.searchPages = async () => ({
    data: [
      {
        id: 'page-1',
        name: 'Mock Cafe',
        link: 'https://www.facebook.com/mockcafe',
        location: { city: 'Kampala', country: 'Uganda' },
      },
    ],
  });

  client.searchPlaces = async () => ({
    data: [
      {
        id: 'place-1',
        name: 'Mock Place',
        link: 'https://www.facebook.com/mockplace',
        location: { city: 'Kampala', country: 'Uganda' },
      },
    ],
  });

  const governor = (provider as unknown as {
    governor: { canSpend: Function; recordSpend: Function };
  }).governor;
  governor.canSpend = async () => true;
  governor.recordSpend = async () => undefined;

  const result = await provider.discoverWithStats({
    ...params,
    acquisitionMode: 'standard',
  });

  assert(result.businesses.length >= 2, 'mock discover returns page + place businesses');
  assert(result.apiCalls >= 2, 'records API calls for page and place searches');
  assert(
    result.businesses.some((b) => b.externalId === 'meta:page:page-1'),
    'includes mocked page',
  );
  assert(
    result.businesses.some((b) => b.externalId === 'meta:place:place-1'),
    'includes mocked place',
  );
}

async function testLiveToken() {
  if (!process.env.META_GRAPH_API_TOKEN) {
    console.log('skip live Meta Graph test (META_GRAPH_API_TOKEN not set)');
    return;
  }

  const provider = new MetaGraphDiscoveryProvider();
  const configured = await provider.isConfigured();
  assert(configured, 'live token is configured');

  const results = await provider.discover({
    country: 'United States',
    city: 'Austin',
    industry: 'Restaurant',
    acquisitionMode: 'economy',
  });

  assert(Array.isArray(results), 'live discover returns array');
  console.log(`live meta graph returned ${results.length} businesses`);
}

testDiscoverWithMockedClient()
  .then(() => testLiveToken())
  .then(() => {
    if (failed > 0) {
      console.error(`\n${failed} failed, ${passed} passed`);
      process.exit(1);
    }
    console.log(`\n${passed} passed`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
