import { isSoftNameMatch, nameSimilarity } from '../name-similarity';

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

assert(isSoftNameMatch('Corner Cafe Bistro', 'Corner Cafe'), 'name: prefix match');
assert(nameSimilarity('Metro Legal Partners', 'Metro Legal Partner') >= 0.7, 'name: partial overlap');
assert(!isSoftNameMatch('Alpha Cafe', 'Beta Gym'), 'name: different businesses rejected');
assert(nameSimilarity('Test Co', 'Test Co') === 1, 'name: identical');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
