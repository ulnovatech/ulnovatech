import { uniqueBusinessIds } from '../lib/unique-business-ids';

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

assert(uniqueBusinessIds([]).length === 0, 'empty input');
assert(uniqueBusinessIds(['a', 'a', 'b']).join(',') === 'a,b', 'dedupes ids');
assert(uniqueBusinessIds(['', '  ', 'x']).join(',') === 'x', 'drops blank ids');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
