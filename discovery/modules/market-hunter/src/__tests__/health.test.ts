import { MARKET_HUNTER_PLATFORMS } from '../types';
import { isAdapterRegistered, listRegisteredAdapterKeys } from '../platforms/registry';
import '../platforms/bootstrap';

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

assert(MARKET_HUNTER_PLATFORMS.length === 6, 'six preloaded platform keys');
assert(MARKET_HUNTER_PLATFORMS.includes('codecanyon'), 'codecanyon in platform list');
assert(isAdapterRegistered('codecanyon'), 'codecanyon live adapter registered');
assert(listRegisteredAdapterKeys().length >= 6, 'all platform adapters bootstrapped');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
