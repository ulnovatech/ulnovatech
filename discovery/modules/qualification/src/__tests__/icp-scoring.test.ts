import { computeLeadScore, meetsMinReachability } from '@agency/scoring';

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

const base = {
  hasWebsite: false,
  httpsEnabled: null as boolean | null,
  mobileFriendly: null as boolean | null,
  enrichmentSignalStrength: 0,
  demandSignalStrength: 0,
  hasEmail: false,
  hasPhone: false,
  industryMatch: true,
};

const withWebsiteBonus = computeLeadScore({
  ...base,
  requireWebsiteOpportunity: true,
});
assert((withWebsiteBonus.factors.noWebsite ?? 0) > 0, 'ICP on adds no-website bonus');

const withoutWebsiteBonus = computeLeadScore({
  ...base,
  requireWebsiteOpportunity: false,
});
assert(withoutWebsiteBonus.factors.noWebsite === undefined, 'ICP off removes no-website bonus');

const demandWeighted = computeLeadScore({
  ...base,
  hasEmail: true,
  demandSignalStrength: 80,
  demandWeightMultiplier: 2,
});
const demandNormal = computeLeadScore({
  ...base,
  hasEmail: true,
  demandSignalStrength: 80,
  demandWeightMultiplier: 1,
});
assert(
  (demandWeighted.factors.demandSignals ?? 0) > (demandNormal.factors.demandSignals ?? 0),
  'demand multiplier increases demand factor',
);

assert(meetsMinReachability('high', 'low') === true, 'high meets low minimum');
assert(meetsMinReachability('low', 'medium') === false, 'low does not meet medium minimum');
assert(meetsMinReachability('none', 'low') === false, 'none does not meet low minimum');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
