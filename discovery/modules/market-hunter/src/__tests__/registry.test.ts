import type { PlatformAdapter } from '../platforms/base.adapter';
import { getPlatformConfig } from '../platforms/platform-config';
import {
  getEnabledAdapters,
  getEnabledPlatformConfigs,
  getGapScoringPlatformConfigs,
  isAdapterRegistered,
  listScanTargets,
  registerPlatformAdapter,
} from '../platforms/registry';
import type { MarketHunterSettings } from '@agency/settings';

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

const mockSettings: MarketHunterSettings = {
  enabled: true,
  maxSpendPerRunUsd: 0.5,
  defaultListingLimit: 20,
  scheduleCron: '0 6 * * 1',
  platforms: {
    codecanyon: true,
    getly: false,
    gumroad: true,
    producthunt: false,
    g2: true,
    reddit: false,
  },
};

const gumroadMock: PlatformAdapter = {
  platformKey: 'gumroad',
  platformName: 'Gumroad',
  role: 'marketplace',
  async fetchListings() {
    return [];
  },
  async getReviews() {
    return [];
  },
  getVisibilityMechanics() {
    return getPlatformConfig('gumroad').mechanics;
  },
};

registerPlatformAdapter(gumroadMock);
assert(isAdapterRegistered('gumroad'), 'gumroad mock adapter registered');

const enabled = getEnabledPlatformConfigs(mockSettings);
assert(
  enabled.map((c) => c.key).sort().join(',') === 'codecanyon,g2,gumroad',
  'enabled configs respect settings toggles',
);

const gap = getGapScoringPlatformConfigs(mockSettings);
assert(
  gap.map((c) => c.key).sort().join(',') === 'codecanyon,gumroad',
  'gap scoring excludes g2 (review signal only)',
);

const targets = listScanTargets(mockSettings);
assert(targets.some((t) => t.platform === 'codecanyon' && t.category === 'mobile/react-native'), 'scan targets expand categories');
assert(!targets.some((t) => t.platform === 'getly'), 'disabled platforms omitted from scan targets');

const adapters = getEnabledAdapters(mockSettings);
assert(adapters.length === 1, 'only registered enabled adapters returned');
assert(
  adapters.some((a) => a.platformKey === 'gumroad'),
  'gumroad mock included in enabled adapters',
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
