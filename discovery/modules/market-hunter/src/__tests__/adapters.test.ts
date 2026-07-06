import '../platforms/bootstrap';
import { MARKET_HUNTER_PLATFORMS } from '../types';
import { isAdapterRegistered, listRegisteredAdapterKeys } from '../platforms/registry';

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

const registered = listRegisteredAdapterKeys();

assert(registered.length === 6, 'six platform adapters registered');

for (const key of MARKET_HUNTER_PLATFORMS) {
  assert(isAdapterRegistered(key), `${key} adapter registered`);
}

assert(isAdapterRegistered('gumroad'), 'gumroad adapter ready');
assert(isAdapterRegistered('reddit'), 'reddit adapter ready');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
