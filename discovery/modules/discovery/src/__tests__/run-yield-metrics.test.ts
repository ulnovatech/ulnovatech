import { countBySource } from '../run-yield-metrics';

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

const mixed = [
  { source: 'google_maps' },
  { source: 'public_search' },
  { source: 'google_maps' },
  { source: 'csv_import' },
];

assert(
  countBySource(mixed).google_maps === 2 &&
    countBySource(mixed).public_search === 1 &&
    countBySource(mixed).csv_import === 1,
  'aggregates counts per source',
);

assert(Object.keys(countBySource([])).length === 0, 'empty sources returns empty object');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
