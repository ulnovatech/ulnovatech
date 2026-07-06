import {
  computeDemandPriority,
  computeOpportunityPriority,
  DEMAND_PRIORITY_BASE,
  UNVERIFIED_OPPORTUNITY_BASE,
  VERIFIED_OPPORTUNITY_BASE,
} from '../work-queue-priority';
import { buildDemandEntry, buildOpportunityEntry, mergeWorkQueueEntries } from '../work-queue';

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
  computeDemandPriority(80) > computeOpportunityPriority(true, 'high', 100),
  'demand outranks verified high-score opportunity',
);

assert(
  computeOpportunityPriority(true, 'high', 90) > computeOpportunityPriority(false, 'high', 90),
  'verified opportunity outranks unverified at same score',
);

assert(
  computeOpportunityPriority(true, 'high', 50) >
    computeOpportunityPriority(true, 'medium', 50),
  'high reachability verified sorts above medium',
);

assert(computeDemandPriority(80) === DEMAND_PRIORITY_BASE + 80, 'demand priority adds strength');
assert(
  computeOpportunityPriority(true, 'none', 40) === VERIFIED_OPPORTUNITY_BASE + 40,
  'verified base + score',
);
assert(
  computeOpportunityPriority(false, 'high', 40) === UNVERIFIED_OPPORTUNITY_BASE + 40,
  'unverified ignores reachability bonus',
);

const merged = mergeWorkQueueEntries(
  [buildDemandEntry({
    id: 'd1',
    source: 'reddit',
    signalType: 'help_request',
    signalStrength: 60,
    title: 'Need website',
    snippet: null,
    sourceUrl: 'https://example.com/1',
    capturedAt: new Date(),
  })],
  [
    buildOpportunityEntry({
      business: { id: 'b1', name: 'Acme', city: 'Cape Town', website: null },
      account: { id: 'a1' },
      run: { id: 'r1', industry: 'dentist', city: 'Cape Town' },
      score: 95,
      reachability: 'high',
      factors: {},
      verified: true,
      demandSignalCount: 0,
      enrichmentSignalCount: 1,
      opportunityType: 'greenfield',
      opportunityTypeLabel: 'Greenfield site',
      pitchAngle: 'Greenfield',
      positiveFactors: [],
      blockers: [],
    }),
  ],
);

assert(merged[0]?.kind === 'demand', 'merged queue leads with demand');

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
