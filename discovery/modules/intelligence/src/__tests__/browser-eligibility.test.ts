import { isBrowserEnrichEligible } from '../browser/eligibility';

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

const eligible = {
  crawlStatus: 'blocked',
  reachability: 'none',
  score: 75,
  hasWebsite: true,
};

assert(isBrowserEnrichEligible(eligible, 60) === true, 'blocked + none reachability + score ok');
assert(isBrowserEnrichEligible({ ...eligible, crawlStatus: 'ok' }, 60) === false, 'not blocked');
assert(isBrowserEnrichEligible({ ...eligible, reachability: 'low' }, 60) === false, 'has reachability');
assert(isBrowserEnrichEligible({ ...eligible, score: 40 }, 60) === false, 'below score threshold');
assert(isBrowserEnrichEligible({ ...eligible, hasWebsite: false }, 60) === false, 'no website');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
