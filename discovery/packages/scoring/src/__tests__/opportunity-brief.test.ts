import {
  buildWebsiteOpportunityBrief,
  deriveOpportunityBrief,
  deriveOpportunityType,
  derivePitchAngle,
  deriveWebsiteGaps,
  getPositiveFactors,
} from '../opportunity-brief';

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
  deriveOpportunityType({
    factors: { demandSignals: 15 },
    demandSignalCount: 2,
  }) === 'demand_response',
  'demand signals map to demand_response type',
);

assert(
  deriveOpportunityType({
    factors: { noWebsite: 20 },
    hasWebsite: false,
  }) === 'greenfield',
  'no website maps to greenfield',
);

assert(
  deriveOpportunityType({
    factors: { notMobileFriendly: 5, noHttps: 5 },
    hasWebsite: true,
  }) === 'redesign',
  'mobile + https gaps map to redesign',
);

const demandPitch = derivePitchAngle({
  factors: { demandSignals: 20, noWebsite: 20 },
  hasWebsite: false,
  demandSignalCount: 1,
});
assert(demandPitch.includes('Hot demand'), 'demand + no website gets hot demand pitch');

const greenfieldPhone = derivePitchAngle({
  factors: { noWebsite: 20, hasPhone: 15 },
  hasWebsite: false,
});
assert(greenfieldPhone.includes('call-first'), 'phone-only greenfield suggests call-first');

const positives = getPositiveFactors({
  noWebsite: 20,
  hasEmail: 30,
  demandSignals: 10,
});
assert(positives[0]?.key === 'hasEmail', 'positive factors sorted by value desc');
assert(positives.length === 3, 'three positive factors');

const brief = deriveOpportunityBrief({
  factors: { noHttps: 5, hasEmail: 30 },
  hasWebsite: true,
});
assert(brief.opportunityType === 'modernize', 'https gap on existing site is modernize');
assert(brief.positiveFactors.length === 2, 'brief includes positive factors');
assert(brief.pitchAngle.length > 10, 'brief includes pitch angle');

const gaps = deriveWebsiteGaps({
  factors: { noWebsite: 20 },
  hasWebsite: false,
  analysis: { hasWebsite: false, httpsEnabled: null, mobileFriendly: null, notes: null },
});
assert(gaps.some((g) => g.key === 'no_website'), 'no website gap detected');

const fullBrief = buildWebsiteOpportunityBrief({
  factors: { noHttps: 5, hasEmail: 30 },
  hasWebsite: true,
  website: 'http://example.com',
  analysis: {
    hasWebsite: true,
    httpsEnabled: false,
    mobileFriendly: false,
    notes: null,
  },
  crawlStatus: 'blocked',
  demandSnippets: [
    {
      id: 's1',
      title: 'Need website',
      snippet: 'Looking for developer',
      signalStrength: 80,
      source: 'reddit',
    },
  ],
});
assert(fullBrief.websiteGaps.length >= 3, 'full brief includes https mobile and crawl gaps');
assert(fullBrief.demandSnippets.length === 1, 'demand snippets included');
assert(fullBrief.outreachHook === fullBrief.pitchAngle, 'outreach hook matches pitch');

const biBrief = deriveOpportunityBrief({
  factors: { hasEmail: 20 },
  hasWebsite: false,
  bi: {
    linktreeOnly: true,
    socialOnlyPresence: true,
    missingOnlineBooking: false,
    missingEmailCapture: false,
    missingAnalytics: false,
    needsLeadGen: false,
    socialPlatformCount: 2,
    primaryPlatform: 'instagram',
  },
});
assert(biBrief.opportunityType === 'greenfield', 'social-only maps to greenfield');
assert(biBrief.pitchAngle.includes('Social-only'), 'BI pitch angle for social-only');

const biGaps = deriveWebsiteGaps({
  factors: {},
  hasWebsite: true,
  bi: {
    linktreeOnly: false,
    socialOnlyPresence: false,
    missingOnlineBooking: true,
    missingEmailCapture: true,
    missingAnalytics: true,
    needsLeadGen: true,
    socialPlatformCount: 0,
    primaryPlatform: null,
  },
});
assert(biGaps.some((g) => g.key === 'no_booking'), 'infrastructure booking gap');
assert(biGaps.some((g) => g.key === 'no_analytics'), 'infrastructure analytics gap');

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
