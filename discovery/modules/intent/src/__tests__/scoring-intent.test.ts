import { computeLeadScore } from '@agency/scoring';

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

const enrichmentOnly = computeLeadScore({
  hasWebsite: true,
  httpsEnabled: true,
  mobileFriendly: true,
  enrichmentSignalStrength: 80,
  demandSignalStrength: 0,
  hasEmail: false,
  hasPhone: false,
  industryMatch: true,
});

const demandOnly = computeLeadScore({
  hasWebsite: true,
  httpsEnabled: true,
  mobileFriendly: true,
  enrichmentSignalStrength: 0,
  demandSignalStrength: 80,
  hasEmail: true,
  hasPhone: false,
  emailValid: true,
  industryMatch: true,
});

assert(
  (demandOnly.factors.demandSignals ?? 0) > (enrichmentOnly.factors.enrichmentSignals ?? 0),
  'demand signals weigh higher than enrichment at same strength',
);
assert(demandOnly.reachability === 'high', 'strong demand with default contact yields high reachability');
assert(demandOnly.score > enrichmentOnly.score, 'demand boosts total score more');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
