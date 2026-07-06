import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import { emptyOpportunityIntelligence } from '../boi/empty-opportunity-intelligence';
import {
  attachOpportunityIntelligenceShell,
  getBiProfileSchemaVersion,
  normalizeBusinessIntelligenceProfile,
} from '../boi/normalize-bi-profile';

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

const empty = emptyOpportunityIntelligence();
assert(empty.status === 'pending', 'empty BOI is pending');
assert(empty.pains.length === 0, 'empty BOI has no pains');

const v1Legacy = {
  schemaVersion: 1,
  accountId: 'acc-legacy',
  businessId: 'biz-legacy',
  enrichedAt: '2026-01-01T00:00:00.000Z',
  identity: { name: 'Legacy Co' },
  contact: {},
  presence: { hasWebsite: false },
  digitalFootprint: { socialLinks: [], linkInBioPages: [], relationshipGraph: { nodes: [], edges: [] } },
  websiteIntel: {},
  infrastructure: {
    booking: [],
    ecommerce: [],
    emailCapture: [],
    analytics: [],
    flags: {
      hasOnlineBooking: false,
      hasEcommerce: false,
      hasEmailCapture: false,
      hasAnalytics: false,
    },
    opportunityFlags: [],
  },
  businessSignals: { reviewSnippets: [], painKeywords: [] },
  completeness: { score: 10, filledFields: ['identity.name'], missingFields: [] },
  opportunityIntelligence: { unknownFutureField: true },
};

const normalizedV1 = normalizeBusinessIntelligenceProfile(v1Legacy);
assert(normalizedV1?.schemaVersion === 1, 'v1 profile stays v1');
assert(normalizedV1?.opportunityIntelligence === undefined, 'v1 reader ignores opportunityIntelligence');

const built = buildBusinessIntelligenceProfile({
  account: { id: 'acc-new', canonicalName: 'New Co' },
  business: { id: 'biz-new', name: 'New Co', source: 'public_search' },
  analysis: null,
});

assert(built.schemaVersion === 2, 'new profiles are schema v2');
assert(built.opportunityIntelligence?.status === 'pending', 'new profiles include pending BOI shell');
assert(getBiProfileSchemaVersion(built) === 2, 'getBiProfileSchemaVersion returns 2');

const v2Raw = {
  ...v1Legacy,
  schemaVersion: 2,
  opportunityIntelligence: empty,
};
const normalizedV2 = normalizeBusinessIntelligenceProfile(v2Raw);
assert(normalizedV2?.schemaVersion === 2, 'v2 profile parses');
assert(normalizedV2?.opportunityIntelligence?.status === 'pending', 'v2 BOI shell preserved');

const upgraded = attachOpportunityIntelligenceShell({
  ...normalizedV1!,
  completeness: normalizedV1!.completeness,
});
assert(upgraded.schemaVersion === 2, 'attachOpportunityIntelligenceShell upgrades shell');
assert(upgraded.opportunityIntelligence?.status === 'pending', 'attach adds BOI shell');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
