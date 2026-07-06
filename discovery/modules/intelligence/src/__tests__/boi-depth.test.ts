import { buildBusinessIntelligenceProfile } from '../bi/build-profile';
import { auditInfrastructureHtml } from '../crawl/infrastructure-audit';
import { detectTechStack } from '../crawl/tech-stack-detect';
import { buildSentimentSummary } from '../boi/build-sentiment-summary';
import { buildDepthEnrichment } from '../boi/build-depth-enrichment';
import { estimateProjectValue, formatUgxRange } from '../boi/estimate-project-value';
import { fetchPageSpeedIfConfigured } from '../boi/fetch-page-speed';
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

function salonProfileWithReviews() {
  return buildBusinessIntelligenceProfile({
    account: {
      id: 'acc-depth',
      canonicalName: 'Glow Salon',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'Salon & Spa',
      crawlStatus: 'no_website',
      rating: 4.1,
      reviewCount: 22,
    },
    business: {
      id: 'biz-depth',
      name: 'Glow Salon',
      source: 'google_maps',
      city: 'Kampala',
      country: 'Uganda',
      industry: 'Salon & Spa',
      rating: 4.1,
      reviewCount: 22,
      metadata: {
        reviews: [
          { text: 'Great service and friendly staff — highly recommend!', rating: 5 },
          { text: 'Hard to book online and long wait times.', rating: 2 },
        ],
      },
    },
    analysis: { hasWebsite: false },
  });
}

const profile = salonProfileWithReviews();
const gapPain = buildBoIGapsAndPains({ profile });

const sentiment = buildSentimentSummary(profile);
assert(sentiment != null, 'sentiment summary built from reviews');
assert((sentiment?.praiseThemes.length ?? 0) > 0, 'sentiment includes praise themes');
assert((sentiment?.complaintThemes.length ?? 0) > 0, 'sentiment includes complaint themes');
assert(sentiment?.reviewCount === 22, 'sentiment uses profile review count');

const crawledProfile = buildBusinessIntelligenceProfile({
  account: {
    id: 'acc-tech',
    canonicalName: 'Shop Co',
    website: 'https://shopco.myshopify.com',
    crawlStatus: 'ok',
    metadata: {
      crawl: {
        pagesFetched: 2,
        pageUrls: ['https://shopco.myshopify.com/', 'https://shopco.myshopify.com/products'],
        title: 'Shop Co',
        infrastructureAudit: auditInfrastructureHtml(
          '<html><script src="https://cdn.shopify.com/s/files/1.js"></script></html>',
        ),
      },
    },
  },
  business: {
    id: 'biz-tech',
    name: 'Shop Co',
    source: 'google_maps',
    website: 'https://shopco.myshopify.com',
  },
  analysis: { hasWebsite: true },
});

const tech = detectTechStack(crawledProfile);
assert(tech != null, 'tech stack detected from crawl');
assert(
  tech!.detected.some((t) => t.category === 'cms' || t.category === 'ecommerce'),
  'tech stack includes CMS or ecommerce vendor',
);
assert(tech!.source === 'website_crawl', 'tech stack source is website_crawl');

const value = estimateProjectValue(profile, gapPain.digitalGaps);
assert(value != null, 'project value estimate produced');
assert(value?.currency === 'UGX', 'project value currency is UGX');
assert(value?.disclaimer === 'estimate', 'project value tagged as estimate');
assert((value?.minUgx ?? 0) < (value?.maxUgx ?? 0), 'project value min < max');
const formatted = formatUgxRange(value!.minUgx, value!.maxUgx);
assert(formatted.length > 8 && /\d/.test(formatted), 'formatUgxRange renders amounts');

const depth = buildDepthEnrichment({
  profile,
  digitalGaps: gapPain.digitalGaps,
  pageSpeed: { performanceScore: 42, strategy: 'mobile', capturedAt: '2026-01-01T00:00:00.000Z' },
});
assert(depth.sentimentSummary != null, 'depth enrichment includes sentiment');
assert(depth.projectValue != null, 'depth enrichment includes project value');
assert(depth.pageSpeed?.performanceScore === 42, 'depth enrichment preserves page speed');

const boi = synthesizeOpportunityIntelligence({
  profile,
  pageSpeed: depth.pageSpeed,
});
assert(boi.sentimentSummary != null, 'synthesis attaches sentiment');
assert(boi.techStack == null || Array.isArray(boi.techStack.detected), 'synthesis tech stack shape valid');
assert(boi.projectValue != null, 'synthesis attaches project value');
assert(boi.pageSpeed != null, 'synthesis attaches page speed when provided');

const sparse = synthesizeOpportunityIntelligence({
  profile: buildBusinessIntelligenceProfile({
    account: { id: 'acc-empty', canonicalName: 'Empty' },
    business: { id: 'biz-empty', name: 'Empty', source: 'public_search' },
    analysis: null,
  }),
});
assert(sparse.sentimentSummary == null, 'sparse profile has no sentiment');
assert(sparse.pageSpeed == null, 'sparse profile has no page speed');

async function runAsyncTests() {
  const prevKey = process.env.GOOGLE_PAGESPEED_KEY;
  delete process.env.GOOGLE_PAGESPEED_KEY;
  const withoutKey = await fetchPageSpeedIfConfigured(crawledProfile);
  assert(withoutKey == null, 'page speed skipped without API key');

  process.env.GOOGLE_PAGESPEED_KEY = 'test-key';
  const mockFetch: typeof fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        lighthouseResult: { categories: { performance: { score: 0.61 } } },
      }),
    }) as Response;

  const withMock = await fetchPageSpeedIfConfigured(crawledProfile, { fetchFn: mockFetch });
  assert(withMock?.performanceScore === 61, 'page speed mock returns score');
  assert(withMock?.strategy === 'mobile', 'page speed strategy is mobile');

  if (prevKey) process.env.GOOGLE_PAGESPEED_KEY = prevKey;
  else delete process.env.GOOGLE_PAGESPEED_KEY;
}

runAsyncTests()
  .then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
