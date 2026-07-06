import { platformSettings } from '@agency/settings';
import {
  buildVerifyTextQuery,
  hasProspectPainSignal,
  isSocialOnlyCandidate,
  needsPlacesVerify,
  prospectVerifyBoost,
  verifyPriority,
} from '../providers/places/needs-verify';
import { GooglePlacesVerifyProvider } from '../providers/places/places-verify';
import type { DiscoveredBusiness } from '../providers/types';

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

const candidate: DiscoveredBusiness = {
  name: 'Joe Kitchen',
  industry: 'Restaurant',
  country: 'Uganda',
  city: 'Kampala',
  source: 'public_search',
  externalId: 'search:abc123',
};

async function main() {
  assert(needsPlacesVerify(candidate) === true, 'public_search candidate needs verify when missing phone');
  assert(
    needsPlacesVerify({ ...candidate, phone: '+256700', rating: 4.2, metadata: { formattedAddress: 'Main St' } }) ===
      false,
    'fully enriched candidate skips verify',
  );
  assert(verifyPriority(candidate) > verifyPriority({ ...candidate, phone: '+256' }), 'missing phone ranks higher');

  const socialOnly: DiscoveredBusiness = {
    ...candidate,
    facebookUrl: 'https://www.facebook.com/joeskitchen',
    metadata: { resultKind: 'social_profile', primaryPlatform: 'facebook' },
  };
  assert(isSocialOnlyCandidate(socialOnly), 'detects social-only candidate');
  assert(
    verifyPriority(socialOnly) > verifyPriority({ ...candidate, phone: '+256700' }),
    'social-only outranks phone-only baseline',
  );

  const painCandidate: DiscoveredBusiness = {
    ...candidate,
    name: 'Joe Kitchen Kampala',
    metadata: { snippet: 'Great food but no website listed' },
  };
  assert(hasProspectPainSignal(painCandidate), 'detects pain keywords in snippet');
  assert(prospectVerifyBoost(painCandidate) >= 3, 'pain signal adds prospect boost');

  const query = buildVerifyTextQuery(candidate, { country: 'Uganda', city: 'Kampala' }, 'All cities');
  assert(query.includes('Joe Kitchen') && query.includes('Kampala'), 'verify query includes name and city');

  if (!process.env.DATABASE_URL) {
    console.log('skip places verify cap integration (DATABASE_URL not set)');
    console.log(`${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }

  await platformSettings.ensureLoaded();
  const before = platformSettings.getSync();
  await platformSettings.updateCredentials({ google_places_api_key: 'test-places-key' });
  await platformSettings.updateAcquisition({
    mode: 'standard',
      places: {
        ...(before.acquisition.places ?? {
          standardVerifyMaxPerRun: 10,
          boostVerifyMaxPerRun: 50,
          standardDiscoverMaxPerRun: 15,
          boostDiscoverMaxPerRun: 40,
          discoverPageSize: 20,
          detailsTopN: 20,
          detailsMinScore: 25,
        }),
        standardVerifyMaxPerRun: 2,
      },
  });
  const verifyMax = platformSettings.getPlacesVerifyMaxPerRun('standard');
  assert(verifyMax === 2, 'settings apply standard verify max');

  const verify = new GooglePlacesVerifyProvider();
  const many: DiscoveredBusiness[] = Array.from({ length: 5 }, (_, i) => ({
    ...candidate,
    name: `Cafe ${i}`,
    externalId: `search:${i}`,
  }));

  const originalTextSearch = (verify as unknown as { client: { textSearch: Function } }).client.textSearch;
  let calls = 0;
  (verify as unknown as { client: { textSearch: Function } }).client.textSearch = async () => {
    calls++;
    return {
      places: [
        {
          id: `places/test-${calls}`,
          displayName: { text: 'Test' },
          nationalPhoneNumber: '+256700',
          rating: 4,
        },
      ],
    };
  };

  const result = await verify.verifyCandidates(many, { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' }, 'test-run');
  assert(result.textSearchCalls <= verifyMax, 'standard verify capped at configured max');
  assert(calls <= verifyMax, 'textSearch invoked at most max times');
  assert(result.capped === Math.max(0, many.length - verifyMax), 'reports capped candidates');

  (verify as unknown as { client: { textSearch: Function } }).client.textSearch = originalTextSearch;

  await platformSettings.updateAcquisition({ mode: before.acquisition.mode, places: before.acquisition.places });
  await platformSettings.updateCredentials({ google_places_api_key: '' });

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
