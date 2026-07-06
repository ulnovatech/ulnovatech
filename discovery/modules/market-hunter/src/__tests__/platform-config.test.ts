import {
  PLATFORM_CONFIG,
  validateAllPlatformConfigs,
  validatePlatformConfig,
} from '../platforms/platform-config';
import { MARKET_HUNTER_PLATFORMS } from '../types';

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

assert(Object.keys(PLATFORM_CONFIG).length === 6, 'six platform configs');
assert(MARKET_HUNTER_PLATFORMS.every((k) => PLATFORM_CONFIG[k] != null), 'every platform key has config');

const validation = validateAllPlatformConfigs();
assert(validation.valid, 'all platform configs pass validation');
if (!validation.valid) {
  console.error(validation.errors);
}

const gapPlatforms = Object.values(PLATFORM_CONFIG).filter((c) => c.supportsGapScoring);
assert(gapPlatforms.length === 4, 'four gap-scoring marketplaces (codecanyon, getly, gumroad, producthunt)');

const type1Only = Object.values(PLATFORM_CONFIG).filter((c) => !c.supportsGapScoring);
assert(
  type1Only.map((c) => c.key).sort().join(',') === 'g2,reddit',
  'g2 and reddit are demand/review signals only',
);

const bad = validatePlatformConfig({
  ...PLATFORM_CONFIG.codecanyon,
  baseUrl: 'http://insecure.example',
});
assert(bad.includes('baseUrl must be https'), 'rejects non-https baseUrl');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
