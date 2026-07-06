import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import { buildOutreachOpener } from '../boi/build-outreach-opener';
import { synthesizeOpportunityIntelligence } from '../boi/synthesize-opportunity-intelligence';
import { composeOutreachBody } from '@agency/outreach';

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

function salonProfile() {
  return buildBusinessIntelligenceProfile({
    account: {
      id: 'acc-opener',
      canonicalName: 'Glow Salon',
      city: 'Kampala',
      industry: 'salon',
      facebookUrl: 'https://facebook.com/glow',
      instagramUrl: 'https://instagram.com/glow',
      crawlStatus: 'no_website',
    },
    business: {
      id: 'biz-opener',
      name: 'Glow Salon',
      source: 'google_maps',
      city: 'Kampala',
      industry: 'salon',
      metadata: {
        reviews: [{ text: 'Great service but hard to book an appointment online.', rating: 3 }],
      },
    },
    analysis: { hasWebsite: false },
  });
}

const profile = salonProfile();
const boi = synthesizeOpportunityIntelligence({ profile });

const opener = buildOutreachOpener({
  businessName: 'Glow Salon',
  city: 'Kampala',
  industry: 'salon',
  pains: boi.pains,
  evidence: boi.evidence,
  pitchAngle: boi.salesBrief?.pitchAngle,
  topService: boi.salesBrief?.recommendedServices?.[0],
});

assert(opener.opener != null, 'opener generated when pains exist');
assert(opener.opener!.includes('Glow Salon'), 'opener names business');
assert(opener.opener!.includes('Kampala'), 'opener mentions city');
assert(opener.evidenceIds.length > 0, 'opener cites evidence ids');
assert(opener.painId != null, 'opener links pain id');

const bookingPain = boi.pains.find((p) => p.id === 'pain:review:hard_to_book');
assert(!!bookingPain, 'fixture has hard_to_book pain');
const bookingOpener = buildOutreachOpener({
  businessName: 'Glow Salon',
  city: 'Kampala',
  industry: 'salon',
  pains: [bookingPain!],
  evidence: boi.evidence,
  topService: 'Online Booking System',
});
assert(
  bookingOpener.opener!.toLowerCase().includes('book'),
  'opener references booking pain keyword',
);

const empty = buildOutreachOpener({
  businessName: 'Empty Co',
  pains: [],
  evidence: [],
});
assert(empty.opener === null, 'no opener without pains');

const merged = composeOutreachBody('Hello {{business}}, following up.', opener.opener);
assert(merged.startsWith(opener.opener!), 'compose prepends opener');
assert(merged.includes('Hello {{business}}'), 'template tokens preserved after opener');

const deduped = composeOutreachBody(opener.opener!, opener.opener);
assert(deduped === opener.opener, 'compose does not duplicate opener');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
