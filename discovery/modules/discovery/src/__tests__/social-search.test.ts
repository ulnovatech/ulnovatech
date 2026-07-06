import { platformSettings } from '@agency/settings';
import { parseSocialSearchResultItem } from '../providers/social/parse-social-search-result';
import { SocialSearchProvider } from '../providers/social/social-search-provider';
import { buildSocialSearchQueries } from '../lib/build-social-search-queries';
import { getSocialSearchQueryLimit } from '../lib/run-profile';

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

const tiktok = parseSocialSearchResultItem(
  {
    title: 'Kampala Eats (@kampalaeats) | TikTok',
    link: 'https://www.tiktok.com/@kampalaeats',
    snippet: 'Local food',
  },
  params,
  'site:tiktok.com Restaurant Kampala',
);
assert(tiktok?.source === 'social_search', 'tiktok source is social_search');
assert(tiktok?.externalId?.startsWith('social:tiktok:') === true, 'tiktok externalId prefix');
assert(tiktok?.metadata?.tiktokUrl?.includes('tiktok.com') === true, 'tiktok url in metadata');
assert(tiktok?.metadata?.primaryPlatform === 'tiktok', 'tiktok primary platform');

const linkedin = parseSocialSearchResultItem(
  {
    title: 'Kampala Eats | LinkedIn',
    link: 'https://www.linkedin.com/company/kampala-eats',
    snippet: 'Restaurant company page',
  },
  params,
  'site:linkedin.com/company Restaurant Kampala',
);
assert(linkedin?.source === 'social_search', 'linkedin source is social_search');
assert(linkedin?.metadata?.linkedinUrl?.includes('linkedin.com') === true, 'linkedin url in metadata');

const youtube = parseSocialSearchResultItem(
  {
    title: 'Kampala Kitchen - YouTube',
    link: 'https://www.youtube.com/@kampalakitchen',
    snippet: 'Channel',
  },
  params,
  'site:youtube.com Restaurant Kampala',
);
assert(youtube?.metadata?.youtubeUrl?.includes('youtube.com') === true, 'youtube url in metadata');

const twitter = parseSocialSearchResultItem(
  {
    title: 'Kampala Eats (@kampalaeats) / X',
    link: 'https://x.com/kampalaeats',
    snippet: 'Local eats',
  },
  params,
  'site:x.com Restaurant Kampala',
);
assert(twitter?.metadata?.twitterUrl?.includes('x.com') === true, 'x url in metadata');

const rejectedFacebook = parseSocialSearchResultItem(
  {
    title: "Joe's Kitchen | Facebook",
    link: 'https://www.facebook.com/joeskitchen',
    snippet: 'Restaurant',
  },
  params,
  'site:facebook.com Restaurant Kampala',
);
assert(rejectedFacebook === null, 'facebook hits rejected (Meta Graph handles FB)');

const rejectedWebsite = parseSocialSearchResultItem(
  {
    title: 'Joe Kitchen — Official Site',
    link: 'https://joekitchen.co.ug',
    snippet: 'Welcome',
  },
  params,
  'Restaurant Kampala',
);
assert(rejectedWebsite === null, 'generic website rejected');

const queries = buildSocialSearchQueries(params, 5);
assert(queries.some((q) => q.includes('site:tiktok.com')), 'queries include tiktok');
assert(queries.some((q) => q.includes('linkedin.com/company')), 'queries include linkedin');
assert(queries.some((q) => q.includes('site:x.com')), 'queries include x.com');
assert(!queries.some((q) => q.includes('facebook.com')), 'queries exclude facebook');
assert(!queries.some((q) => q.includes('instagram.com')), 'queries exclude instagram');

async function runQueryLimitCheck() {
  await platformSettings.ensureLoaded();
  assert(getSocialSearchQueryLimit('economy') >= 4, 'economy social query limit configured');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log('skip social search integration tests (DATABASE_URL not set)');
    if (failed > 0) {
      console.error(`\n${failed} failed, ${passed} passed`);
      process.exit(1);
    }
    console.log(`\n${passed} passed`);
    return;
  }

  await platformSettings.ensureLoaded();
  await runQueryLimitCheck();
  await testDiscoverWithMockedSearch();

  if (failed > 0) {
    console.error(`\n${failed} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`\n${passed} passed`);
}

async function testDiscoverWithMockedSearch() {
  const provider = new SocialSearchProvider();
  provider.isConfigured = async () => true;

  const governor = (provider as unknown as {
    governor: { canSpend: Function; recordSpend: Function };
  }).governor;
  governor.canSpend = async () => true;
  governor.recordSpend = async () => undefined;

  (provider as unknown as { searchQuery: Function }).searchQuery = async () => ({
    items: [
      {
        title: 'Kampala Eats (@kampalaeats) | TikTok',
        link: 'https://www.tiktok.com/@kampalaeats',
        snippet: 'Local food',
      },
      {
        title: 'Best Restaurants List',
        link: 'https://example.com/top-10-restaurants',
        snippet: 'Listicle',
      },
    ],
    apiCalls: 1,
    budgetExhausted: false,
  });

  const result = await provider.discoverWithStats({
    ...params,
    acquisitionMode: 'standard',
  });

  assert(result.businesses.length >= 1, 'mock discover returns social profiles');
  assert(result.businesses.every((b) => b.source === 'social_search'), 'all results social_search source');
  assert(result.droppedNonSocial >= 1, 'non-social results dropped');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
