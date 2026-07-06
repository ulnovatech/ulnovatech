import {
  canPromoteFromReview,
  isProspectVerified,
} from '../review-verification';

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

assert(
  isProspectVerified({ businessEmail: '  hello@example.com ' }),
  'business email counts as verified',
);
assert(
  isProspectVerified({ accountPhone: '+1 555-0100' }),
  'account phone counts as verified',
);
assert(
  isProspectVerified({ accountMetadata: { placesVerified: true } }),
  'placesVerified metadata counts as verified',
);
assert(
  isProspectVerified({ accountMetadata: { placesId: 'ChIJabc123' } }),
  'placesId metadata counts as verified',
);
assert(!isProspectVerified({}), 'empty contact is not verified');

const blocked = canPromoteFromReview({
  verified: false,
  reachability: 'none',
  hasEmail: false,
  hasPhone: false,
});
assert(!blocked.allowed, 'blocks promote when unverified with no contact');
assert(!!blocked.reason, 'blocked promote includes reason');

const allowed = canPromoteFromReview({
  verified: true,
  reachability: 'none',
  hasEmail: false,
  hasPhone: false,
});
assert(allowed.allowed, 'allows promote when verified');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
