import { buildWinLossBySource } from '../revenue-metrics';

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

const rows = buildWinLossBySource([
  { channel: 'demand', won: '2', lost: '1' },
  { channel: 'discovery', won: '1', lost: '3' },
]);

assert(rows.length === 2, 'returns demand and discovery');
assert(rows[0]?.channel === 'demand', 'demand first');
assert(rows[0]?.won === 2 && rows[0]?.lost === 1, 'demand counts');
assert(rows[0]?.winRate === 66.7, 'demand win rate');
assert(rows[1]?.channel === 'discovery', 'discovery second');
assert(rows[1]?.winRate === 25, 'discovery win rate');

const empty = buildWinLossBySource([]);
assert(empty[0]?.won === 0 && empty[0]?.winRate === null, 'empty demand defaults');
assert(empty[1]?.won === 0 && empty[1]?.winRate === null, 'empty discovery defaults');

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
