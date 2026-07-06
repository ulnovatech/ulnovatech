import { prospectFocusQueryRatio, prospectQueryRatio } from '@agency/config';
import { buildPublicSearchQueries } from '../lib/build-public-search-queries';
import {
  countHighPotentialEstimate,
  countProspectCandidates,
} from '../lib/prospect-metrics';
import type { DiscoveredBusiness } from '../providers/types';

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

const baseParams = { country: 'Uganda', city: 'Kampala', industry: 'Salon & Spa' };

const normalQueries = buildPublicSearchQueries(baseParams, 15);
const focusQueries = buildPublicSearchQueries({ ...baseParams, prospectFocus: true }, 15);

const normalRatio = prospectQueryRatio();
const focusRatio = prospectFocusQueryRatio();
assert(focusRatio > normalRatio, 'prospect focus ratio exceeds default');

const prospectish = (q: string) =>
  /facebook|no website|instagram|site:facebook/i.test(q);
const normalProspectCount = normalQueries.filter(prospectish).length;
const focusProspectCount = focusQueries.filter(prospectish).length;
assert(
  focusProspectCount >= normalProspectCount,
  'prospect focus yields at least as many prospect-template queries',
);

const candidates: DiscoveredBusiness[] = [
  {
    name: 'Glow Salon',
    source: 'public_search',
    facebookUrl: 'https://facebook.com/glow',
    metadata: { resultKind: 'social_profile' },
  },
  {
    name: 'Joe Kitchen',
    source: 'public_search',
    metadata: { snippet: 'Great food but no website' },
  },
  {
    name: 'Full Biz',
    source: 'google_maps',
    website: 'https://example.com',
    phone: '+256700',
  },
];

assert(countProspectCandidates(candidates) === 2, 'counts prospect-signal candidates');
assert(countHighPotentialEstimate(candidates) === 1, 'high potential requires boost >= 4');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
