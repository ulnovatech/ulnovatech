import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import { computeBiCompleteness } from '../bi/compute-completeness';
import { detectSocialPlatform } from '../bi/social-links';

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

assert(detectSocialPlatform('https://www.facebook.com/acme') === 'facebook', 'facebook platform');
assert(detectSocialPlatform('https://tiktok.com/@shop') === 'tiktok', 'tiktok platform');

const profile = buildBusinessIntelligenceProfile({
  account: {
    id: 'acc-1',
    canonicalName: 'Acme Dental',
    email: 'hello@acme.test',
    phone: '+1 555 0100',
    website: 'https://acme.test',
    city: 'Austin',
    country: 'United States',
    industry: 'dentist',
    source: 'google_maps',
    googleMapsUrl: 'https://maps.google.com/?cid=1',
    facebookUrl: 'https://facebook.com/acme',
    instagramUrl: null,
    rating: 4.5,
    reviewCount: 12,
    crawlStatus: 'ok',
    lastCrawledAt: new Date('2026-06-01T12:00:00Z'),
    metadata: {
      crawl: {
        title: 'Acme Dental — Austin',
        metaDescription: 'Family dentist',
        pagesFetched: 2,
        pageUrls: ['https://acme.test', 'https://acme.test/contact'],
        socialUrls: ['https://tiktok.com/@acmedental'],
        infrastructureAudit: {
          booking: [],
          ecommerce: [],
          emailCapture: [],
          analytics: [{ category: 'analytics', vendor: 'google_analytics', evidence: 'GA', confidence: 'high' }],
          flags: { hasOnlineBooking: false, hasEcommerce: false, hasEmailCapture: false, hasAnalytics: true },
          opportunityFlags: ['missing_email_capture'],
        },
      },
    },
  },
  business: {
    id: 'biz-1',
    name: 'Acme Dental',
    industry: 'dentist',
    website: 'https://acme.test',
    phone: '+1 555 0100',
    email: 'hello@acme.test',
    city: 'Austin',
    country: 'United States',
    source: 'google_maps',
    googleMapsUrl: 'https://maps.google.com/?cid=1',
    facebookUrl: 'https://facebook.com/acme',
    instagramUrl: 'https://instagram.com/acme',
    rating: 4.5,
    reviewCount: 12,
    metadata: { tiktokUrl: 'https://tiktok.com/@acmedental' },
  },
  analysis: {
    hasWebsite: true,
    httpsEnabled: true,
    mobileFriendly: true,
    notes: 'Crawl ok',
  },
  discoveryRunId: 'run-1',
});

assert(profile.schemaVersion === 2, 'schema version v2');
assert(profile.opportunityIntelligence?.status === 'pending', 'pending BOI shell on new profile');
assert(profile.identity.name === 'Acme Dental', 'identity name');
assert(profile.digitalFootprint.socialLinks.length >= 2, 'collects social links');
assert(Array.isArray(profile.digitalFootprint.relationshipGraph.nodes), 'has relationship graph');
assert(profile.infrastructure.flags.hasAnalytics === false || profile.infrastructure.analytics.length > 0, 'infrastructure analytics consistent');
assert(profile.completeness.score > 50, 'completeness above half for rich profile');
assert(profile.websiteIntel.title === 'Acme Dental — Austin', 'crawl title merged');

const sparse = buildBusinessIntelligenceProfile({
  account: {
    id: 'acc-2',
    canonicalName: 'Sparse Co',
  },
  business: {
    id: 'biz-2',
    name: 'Sparse Co',
    source: 'public_search',
  },
  analysis: null,
});

assert(sparse.completeness.score < profile.completeness.score, 'sparse profile scores lower');

const completenessOnly = computeBiCompleteness({
  ...profile,
  completeness: { score: 0, filledFields: [], missingFields: [] },
});
assert(completenessOnly.score === profile.completeness.score, 'computeBiCompleteness stable');

const withReviews = buildBusinessIntelligenceProfile({
  account: {
    id: 'acc-3',
    canonicalName: 'Review Cafe',
  },
  business: {
    id: 'biz-3',
    name: 'Review Cafe',
    source: 'google_maps',
    metadata: {
      reviews: [
        { text: 'Nice spot but no website and hard to book a table.', rating: 3 },
      ],
    },
  },
  analysis: null,
});

assert(withReviews.businessSignals.reviewSnippets.length === 1, 'businessSignals review snippets');
assert(withReviews.businessSignals.painKeywords.length >= 2, 'businessSignals pain keywords');
assert(
  withReviews.completeness.filledFields.includes('businessSignals.reviewSnippets'),
  'completeness credits review snippets',
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
