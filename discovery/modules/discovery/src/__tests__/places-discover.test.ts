import { platformSettings } from '@agency/settings';
import { placeSearchResultToDiscoveredBusiness, placesIdFromExternalId } from '../providers/places/place-to-candidate';
import { GooglePlacesDiscoveryProvider } from '../providers/places/places-discover';
import type { PlacesTextSearchResult } from '../providers/places/places-types';
import { buildCitySearchQueries } from '../lib/build-search-query';

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

const samplePlace: PlacesTextSearchResult = {
  id: 'places/ChIJtest123',
  displayName: { text: 'Joe Kitchen' },
  formattedAddress: 'Main St, Kampala, Uganda',
  websiteUri: 'https://joekitchen.example',
  nationalPhoneNumber: '+256700000000',
  rating: 4.2,
  userRatingCount: 88,
  googleMapsUri: 'https://maps.google.com/?cid=1',
  addressComponents: [{ longText: 'Kampala', types: ['locality'] }],
  businessStatus: 'OPERATIONAL',
};

const mapped = placeSearchResultToDiscoveredBusiness(samplePlace, params);
assert(mapped?.source === 'google_maps', 'mapped source is google_maps');
assert(mapped?.externalId === 'places/ChIJtest123', 'externalId is places-prefixed');
assert(placesIdFromExternalId(mapped?.externalId) === 'ChIJtest123', 'places id extracted');
assert(mapped?.phone === '+256700000000', 'phone mapped');
assert(mapped?.city === 'Kampala', 'city from address components');
assert(mapped?.metadata?.placesVerified === true, 'marked places verified');

const queries = buildCitySearchQueries(params);
assert(queries.length === 1, 'single city yields one query');
assert(queries[0].includes('Restaurant') && queries[0].includes('Kampala'), 'query includes industry and city');

async function testDiscoverPagination() {
  if (!process.env.DATABASE_URL) {
    console.log('skip places discover pagination test (DATABASE_URL not set)');
    return;
  }

  await platformSettings.ensureLoaded();
  const provider = new GooglePlacesDiscoveryProvider();
  const originalConfigured = provider.isConfigured.bind(provider);
  let callCount = 0;

  provider.isConfigured = async () => true;

  const client = (provider as unknown as { client: { textSearch: Function; isConfigured: Function } }).client;
  const originalTextSearch = client.textSearch;
  client.textSearch = async (
    _query: string,
    _region: string | undefined,
    _runId: string | undefined,
    options?: { pageToken?: string },
  ) => {
    callCount++;
    if (!options?.pageToken) {
      return {
        places: [samplePlace],
        nextPageToken: 'page2',
      };
    }
    return {
      places: [
        {
          ...samplePlace,
          id: 'places/ChIJtest456',
          displayName: { text: 'Second Cafe' },
        },
      ],
    };
  };

  const result = await provider.discoverWithStats({
    ...params,
    acquisitionMode: 'standard',
  });

  assert(result.businesses.length === 2, 'pagination yields two unique places');
  assert(result.textSearchCalls === 2, 'two API calls for paginated query');
  assert(result.businesses.every((b) => b.source === 'google_maps'), 'all from google_maps');

  client.textSearch = originalTextSearch;
  provider.isConfigured = originalConfigured;
}

testDiscoverPagination()
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
