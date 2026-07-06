import {
  emptyHealthState,
  isCustomScrapeDegraded,
  recordPollOutcome,
} from '../providers/custom/health';

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

assert(isCustomScrapeDegraded(emptyHealthState()) === false, 'empty not degraded');

const twoFailures = {
  ...emptyHealthState(),
  recentDays: [
    { date: '2026-06-01', attempted: true, success: false },
    { date: '2026-06-02', attempted: true, success: false },
  ],
};
assert(isCustomScrapeDegraded(twoFailures) === false, 'two failed days not degraded yet');

const threeFailures = {
  ...emptyHealthState(),
  recentDays: [
    { date: '2026-06-01', attempted: true, success: false },
    { date: '2026-06-02', attempted: true, success: false },
    { date: '2026-06-03', attempted: true, success: false },
  ],
};
assert(isCustomScrapeDegraded(threeFailures) === true, 'three failed days degraded');

const successHealth = recordPollOutcome(emptyHealthState(), true);
assert(successHealth.lastSuccessAt !== null, 'records success timestamp');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
