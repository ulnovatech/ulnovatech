import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import { buildBoIGapsAndPains } from '../boi/build-structured-pains';
import { buildDigitalGaps } from '../boi/build-digital-gaps';
import { buildStructuredPains } from '../boi/build-structured-pains';
import { BoIEvidenceRegistry } from '../boi/evidence-registry';
import type { BusinessIntelligenceProfile } from '../bi/types';

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

function socialOnlyNoWebsiteProfile(): BusinessIntelligenceProfile {
  return buildBusinessIntelligenceProfile({
    account: {
      id: 'acc-social',
      canonicalName: 'Glow Salon',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'salon',
      facebookUrl: 'https://facebook.com/glowsalon',
      instagramUrl: 'https://instagram.com/glowsalon',
      crawlStatus: 'no_website',
      metadata: {},
    },
    business: {
      id: 'biz-social',
      name: 'Glow Salon',
      source: 'google_maps',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'salon',
      facebookUrl: 'https://facebook.com/glowsalon',
      instagramUrl: 'https://instagram.com/glowsalon',
      googleMapsUrl: 'https://maps.google.com/?cid=glow',
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

const richProfile = socialOnlyNoWebsiteProfile();
const result = buildBoIGapsAndPains({ profile: richProfile });

assert(result.digitalGaps.some((g) => g.id === 'no_website'), 'gap: no_website');
assert(result.digitalGaps.some((g) => g.id === 'social_only'), 'gap: social_only');
assert(result.pains.length >= 2, 'at least two pains with evidence');
assert(
  result.pains.every((p) => p.evidenceIds.length > 0 && p.confidence > 0),
  'every pain has evidence and confidence',
);
assert(
  result.pains.some((p) => p.id === 'pain:review:hard_to_book'),
  'pain from hard_to_book review',
);
assert(
  result.pains.some((p) => p.id === 'pain:no_web_presence'),
  'pain for no web presence',
);
assert(
  result.evidence.length >= result.pains.length,
  'evidence registry covers pain citations',
);
assert(
  result.digitalGaps.every((g) => g.evidenceIds.every((id) => result.evidence.some((e) => e.id === id))),
  'gap evidence ids resolve',
);

const healthyProfile = buildBusinessIntelligenceProfile({
  account: {
    id: 'acc-healthy',
    canonicalName: 'Healthy Co',
    website: 'https://healthy.test',
    crawlStatus: 'ok',
    metadata: {
      crawl: {
        infrastructureAudit: {
          booking: [{ category: 'booking', vendor: 'calendly', evidence: 'Calendly', confidence: 'high' }],
          ecommerce: [{ category: 'ecommerce', vendor: 'shopify', evidence: 'Shopify', confidence: 'high' }],
          emailCapture: [{ category: 'email_capture', vendor: 'mailchimp', evidence: 'Mailchimp', confidence: 'high' }],
          analytics: [{ category: 'analytics', vendor: 'google_analytics', evidence: 'GA', confidence: 'high' }],
          flags: {
            hasOnlineBooking: true,
            hasEcommerce: true,
            hasEmailCapture: true,
            hasAnalytics: true,
          },
          opportunityFlags: [],
        },
      },
    },
  },
  business: {
    id: 'biz-healthy',
    name: 'Healthy Co',
    website: 'https://healthy.test',
    source: 'google_maps',
  },
  analysis: { hasWebsite: true, httpsEnabled: true, mobileFriendly: true },
});
const sparseGaps = buildDigitalGaps(healthyProfile, new BoIEvidenceRegistry());
const sparsePains = buildStructuredPains(healthyProfile, new BoIEvidenceRegistry());
assert(sparseGaps.length === 0, 'no gaps without evidence');
assert(sparsePains.length === 0, 'no pains without evidence');

const crawledProfile = buildBusinessIntelligenceProfile({
  account: {
    id: 'acc-crawl',
    canonicalName: 'Book Me Spa',
    website: 'https://bookme.test',
    crawlStatus: 'ok',
    metadata: {
      crawl: {
        title: 'Book Me Spa',
        infrastructureAudit: {
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
          opportunityFlags: ['missing_online_booking', 'missing_email_capture'],
        },
      },
    },
  },
  business: {
    id: 'biz-crawl',
    name: 'Book Me Spa',
    website: 'https://bookme.test',
    source: 'google_maps',
  },
  analysis: { hasWebsite: true, httpsEnabled: true, mobileFriendly: true },
});

const crawlResult = buildBoIGapsAndPains({ profile: crawledProfile });
assert(
  crawlResult.digitalGaps.some((g) => g.id === 'missing_online_booking'),
  'crawl gap: missing booking',
);
assert(
  crawlResult.pains.some((p) => p.id === 'pain:booking_gap'),
  'crawl pain: booking gap',
);

const intentResult = buildBoIGapsAndPains({
  profile: richProfile,
  intentSignals: [
    {
      id: 'sig-1',
      source: 'bi_profile',
      signalType: 'footprint_gap',
      title: 'Social presence without owned website',
      snippet: 'Found 2 social profiles but no owned website.',
      signalStrength: 78,
    },
  ],
});
assert(
  intentResult.pains.some((p) => p.label.includes('Social presence')),
  'intent signal becomes structured pain',
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
