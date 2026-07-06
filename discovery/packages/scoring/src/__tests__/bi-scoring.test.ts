import {
  applyBiScoringFactors,
  biScoringInputFromProfile,
  deriveBiScoringHints,
  hasRealWebsite,
  isLinkInBioWebsite,
} from '../bi-scoring';
import { computeLeadScore } from '../index';

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

assert(isLinkInBioWebsite('https://linktr.ee/acme'), 'detects linktr.ee');
assert(!isLinkInBioWebsite('https://acme.test'), 'real domain not link-in-bio');

const sampleProfile = biScoringInputFromProfile({
  contact: { website: 'https://linktr.ee/acme' },
  presence: { hasWebsite: true },
  digitalFootprint: {
    socialLinks: [{ platform: 'instagram' }, { platform: 'tiktok' }],
    linkInBioPages: [{ resolvedWebsite: null }],
  },
  infrastructure: {
    opportunityFlags: ['missing_online_booking', 'missing_analytics'],
    flags: {
      hasOnlineBooking: false,
      hasEmailCapture: false,
      hasAnalytics: false,
      hasEcommerce: false,
    },
  },
});

const hints = deriveBiScoringHints(sampleProfile);
assert(hints.linktreeOnly === true, 'link-in-bio website flagged');
assert(hints.missingOnlineBooking === true, 'missing booking from flags');
assert(hints.needsLeadGen === true, 'needs lead gen when analytics/email missing');

const factors = applyBiScoringFactors({}, hints);
assert((factors.linktreeOnly ?? 0) > 0, 'linktree factor applied');
assert((factors.noBooking ?? 0) > 0, 'no booking factor applied');

const scored = computeLeadScore({
  hasWebsite: true,
  httpsEnabled: true,
  mobileFriendly: true,
  enrichmentSignalStrength: 0,
  demandSignalStrength: 0,
  hasEmail: true,
  hasPhone: false,
  industryMatch: true,
  bi: sampleProfile,
});
assert((scored.factors.linktreeOnly ?? 0) > 0, 'computeLeadScore merges BI factors');

assert(
  !hasRealWebsite({
    hasWebsite: false,
    website: null,
    resolvedWebsiteFromBio: null,
  }),
  'no real website without site',
);

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
