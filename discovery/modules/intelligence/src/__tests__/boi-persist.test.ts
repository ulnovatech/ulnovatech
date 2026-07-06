import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import {
  buildOpportunityBriefPayload,
  isBoiAvailable,
  readBoiFromProfile,
  writeBoiToProfile,
} from '../boi/boi-repository';
import { synthesizeOpportunityIntelligence } from '../boi/synthesize-opportunity-intelligence';

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

function socialProfile() {
  return buildBusinessIntelligenceProfile({
    account: {
      id: 'acc-persist',
      canonicalName: 'Glow Salon',
      phone: '+256 700 000001',
      facebookUrl: 'https://facebook.com/glow',
      instagramUrl: 'https://instagram.com/glow',
      crawlStatus: 'no_website',
    },
    business: {
      id: 'biz-persist',
      name: 'Glow Salon',
      source: 'google_maps',
      phone: '+256 700 000001',
      facebookUrl: 'https://facebook.com/glow',
      instagramUrl: 'https://instagram.com/glow',
      reviewCount: 12,
      metadata: {
        reviews: [{ text: 'Hard to book online without a website.', rating: 3 }],
      },
    },
    analysis: { hasWebsite: false },
  });
}

const pendingProfile = socialProfile();
assert(
  pendingProfile.opportunityIntelligence?.status === 'pending',
  'builder still attaches pending shell before synthesis',
);

const boi = synthesizeOpportunityIntelligence({ profile: pendingProfile });
const persisted = writeBoiToProfile(pendingProfile, boi);

assert(readBoiFromProfile(persisted)?.status === 'ready', 'persisted BOI is ready');
assert(isBoiAvailable(readBoiFromProfile(persisted)), 'isBoiAvailable true after synthesis');
assert(
  !isBoiAvailable(pendingProfile.opportunityIntelligence),
  'pending shell is not API-ready',
);

const payload = buildOpportunityBriefPayload(persisted);
assert(payload != null, 'brief payload built');
assert(payload!.businessId === 'biz-persist', 'payload business id');
assert(!!payload!.salesBrief?.executiveSummary, 'payload includes sales brief');
assert(payload!.pains.length > 0, 'payload includes pains');
assert(payload!.solutions.length > 0, 'payload includes solutions');
assert(
  (payload!.salesBrief?.evidenceIds?.length ?? 0) > 0,
  'payload brief cites evidence ids',
);
assert(buildOpportunityBriefPayload(pendingProfile) === null, 'pending profile returns null payload');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
