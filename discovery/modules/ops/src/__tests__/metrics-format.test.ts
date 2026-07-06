import { formatPercent, formatRateLabel } from '../metrics-format';

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

assert(formatPercent(4, 10) === 40, 'formatPercent 40%');
assert(formatPercent(1, 3) === 33.3, 'formatPercent rounds one decimal');
assert(formatPercent(1, 0) === null, 'formatPercent zero denominator');
assert(formatRateLabel(42.5) === '42.5%', 'formatRateLabel percent');
assert(formatRateLabel(null) === '—', 'formatRateLabel null');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
