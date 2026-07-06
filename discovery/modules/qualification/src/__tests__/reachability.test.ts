import { computeLeadScore, computeReachability } from '@agency/scoring';

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

const highScoreNoEmail = computeLeadScore({
  hasWebsite: false,
  httpsEnabled: null,
  mobileFriendly: null,
  enrichmentSignalStrength: 80,
  demandSignalStrength: 0,
  hasEmail: false,
  hasPhone: false,
  industryMatch: true,
});

assert(highScoreNoEmail.reachability === 'none', 'high opportunity score without email is reachability none');
assert(highScoreNoEmail.score < 50, 'no contact path caps effective score');

const withPhoneOnly = computeReachability({
  hasEmail: false,
  hasPhone: true,
  demandSignalStrength: 0,
});

assert(withPhoneOnly === 'low', 'phone only is low reachability');

const withEmailAndDemand = computeReachability({
  hasEmail: true,
  hasPhone: false,
  emailValid: true,
  demandSignalStrength: 70,
});

assert(withEmailAndDemand === 'high', 'email + demand is high reachability');

const suppressed = computeLeadScore({
  hasWebsite: true,
  httpsEnabled: true,
  mobileFriendly: true,
  hasEmail: true,
  hasPhone: true,
  emailValid: true,
  industryMatch: true,
  suppressed: true,
});

assert(suppressed.reachability === 'none', 'suppressed is none reachability');
assert((suppressed.factors.suppressed ?? 0) < 0, 'suppressed applies penalty');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
