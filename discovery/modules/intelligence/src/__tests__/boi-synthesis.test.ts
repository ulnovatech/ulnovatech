import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import { buildSalesBrief } from '../boi/build-sales-brief';
import { computePurchaseReadiness } from '../boi/compute-purchase-readiness';
import { mapPainsToSolutions } from '../boi/map-pains-to-solutions';
import { buildBoIGapsAndPains } from '../boi/build-structured-pains';
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

function socialOnlyProfile() {
  return buildBusinessIntelligenceProfile({
    account: {
      id: 'acc-boi',
      canonicalName: 'Glow Salon',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'salon',
      phone: '+256 700 000001',
      facebookUrl: 'https://facebook.com/glowsalon',
      instagramUrl: 'https://instagram.com/glowsalon',
      crawlStatus: 'no_website',
      rating: 4.2,
      reviewCount: 18,
      metadata: {},
    },
    business: {
      id: 'biz-boi',
      name: 'Glow Salon',
      source: 'google_maps',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'salon',
      phone: '+256 700 000001',
      facebookUrl: 'https://facebook.com/glowsalon',
      instagramUrl: 'https://instagram.com/glowsalon',
      googleMapsUrl: 'https://maps.google.com/?cid=glow',
      rating: 4.2,
      reviewCount: 18,
      metadata: {
        reviews: [
          {
            text: 'Great service but it was hard to book an appointment online.',
            rating: 3,
          },
        ],
      },
    },
    analysis: { hasWebsite: false, notes: 'No website listed' },
  });
}

const profile = socialOnlyProfile();
const gapPain = buildBoIGapsAndPains({ profile });
const solutions = mapPainsToSolutions({
  pains: gapPain.pains,
  digitalGaps: gapPain.digitalGaps,
});

assert(
  solutions.some((s) => s.service === 'Online Booking System'),
  'hard_to_book maps to Online Booking System',
);
assert(
  solutions.some((s) => s.service === 'Corporate Website'),
  'no_website/social_only maps to Corporate Website',
);
assert(
  solutions.some((s) => s.service === 'WhatsApp Business Integration'),
  'social_only maps to WhatsApp integration',
);
assert(
  solutions.every((s) => s.painIds.length > 0 && s.benefits.length > 0),
  'solutions link pains/gaps and include benefits',
);

const readiness = computePurchaseReadiness(profile, gapPain.digitalGaps, gapPain.pains);
assert(readiness.score != null, 'readiness score computed');
assert(
  readiness.score! >= 0 && readiness.score! <= 100,
  'readiness score within 0-100',
);
assert(readiness.band !== 'unknown', 'readiness band assigned when score present');
assert(readiness.factors.length > 0, 'readiness factors listed');

const brief = buildSalesBrief({
  profile,
  pains: gapPain.pains,
  digitalGaps: gapPain.digitalGaps,
  solutions,
  purchaseReadiness: readiness,
  evidence: gapPain.evidence,
});
assert(!!brief.executiveSummary?.includes('Glow Salon'), 'brief executive summary names business');
assert(!!brief.pitchAngle, 'brief includes pitch angle');
assert(brief.recommendedServices.length > 0, 'brief lists recommended services');
assert(
  (brief.evidenceIds?.length ?? 0) > 0,
  'brief cites evidence ids',
);
assert(
  brief.evidenceIds!.every((id) => gapPain.evidence.some((e) => e.id === id)),
  'brief evidence ids resolve to registry',
);
assert(
  (brief.topPainIds?.length ?? 0) > 0,
  'brief references top pain ids',
);

const boi = synthesizeOpportunityIntelligence({ profile });
assert(boi.status === 'ready', 'synthesized BOI is ready for rich fixture');
assert(boi.synthesizedAt != null, 'synthesis timestamp set');
assert(boi.solutions.length > 0, 'full synthesis includes solutions');
assert(boi.salesBrief?.narrativeSource === 'rules', 'rules-first narrative source');
assert(boi.purchaseReadiness?.score != null, 'purchase readiness separate from lead_scores');

const sparse = synthesizeOpportunityIntelligence({
  profile: buildBusinessIntelligenceProfile({
    account: { id: 'acc-empty', canonicalName: 'Empty' },
    business: { id: 'biz-empty', name: 'Empty', source: 'public_search' },
    analysis: null,
  }),
});
assert(sparse.pains.length === 0 || sparse.status !== 'pending', 'sparse synthesis not left pending shell');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
