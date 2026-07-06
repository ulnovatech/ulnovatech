import type { PlatformAdapter } from '../platforms/base.adapter';
import { getPlatformConfig } from '../platforms/platform-config';
import { registerPlatformAdapter } from '../platforms/registry';
import { runScanPipeline } from '../orchestrator';
import { getPlatformConfig } from '../platforms/platform-config';
import {
  ghostListing,
  type2Complaints,
  type2Listing,
  type3Listing,
} from './fixtures/scoring-listings';

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

const mockAdapter: PlatformAdapter = {
  platformKey: 'codecanyon',
  platformName: 'CodeCanyon',
  role: 'marketplace',
  async fetchListings() {
    return [ghostListing, type2Listing, type3Listing];
  },
  async getReviews() {
    return ['review one', 'review two'];
  },
  getVisibilityMechanics() {
    return getPlatformConfig('codecanyon').mechanics;
  },
};

registerPlatformAdapter(mockAdapter);

async function run() {
  const result = await runScanPipeline('00000000-0000-4000-8000-000000000001', {
  settings: {
    enabled: true,
    maxSpendPerRunUsd: 1,
    defaultListingLimit: 20,
    scheduleCron: '0 6 * * 1',
    platforms: {
      codecanyon: true,
      getly: false,
      gumroad: false,
      producthunt: false,
      g2: false,
      reddit: false,
    },
  },
  scanTargets: [
    {
      platform: 'codecanyon',
      category: 'mobile/react-native',
      config: getPlatformConfig('codecanyon'),
    },
  ],
  repo: {
    saveListings: async () => [],
    getScanSpendTotal: async () => 0,
    recordSpend: async () => ({ id: 'x' }),
  } as never,
  extractComplaintsFn: async () => type2Complaints,
  getReviewTexts: async () => ['needs dark mode', 'ios bug', 'docs bad'],
});

assert(result.stats.listingsFetched === 3, 'orchestrator counts fetched listings');
assert(result.stats.ghostsFiltered === 1, 'ghost filtered in pipeline');
assert(result.cards.length >= 1, 'at least one action card generated');
assert(
  result.cards.every((c) => c.originalUrl.startsWith('https://')),
  'every card has real originalUrl',
);
assert(
  result.cards[0]!.gapScore >= (result.cards[1]?.gapScore ?? 0),
  'cards sorted by gap score',
);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
