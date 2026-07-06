import { clampFailedJobsDays, clampFailedJobsLimit } from '../failed-jobs-service';

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

assert(clampFailedJobsDays(undefined) === 7, 'default days is 7');
assert(clampFailedJobsDays(0) === 1, 'days floor at 1');
assert(clampFailedJobsDays(120) === 90, 'days cap at 90');
assert(clampFailedJobsLimit(undefined) === 50, 'default limit is 50');
assert(clampFailedJobsLimit(0) === 1, 'limit floor at 1');
assert(clampFailedJobsLimit(200) === 50, 'limit cap at 50');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
