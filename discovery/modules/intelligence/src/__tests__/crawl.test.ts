import { computeLeadScore } from '@agency/scoring';
import { CrawlService } from '../crawl/crawl-service';

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

const blockedScore = computeLeadScore({
  hasWebsite: true,
  httpsEnabled: true,
  mobileFriendly: true,
  intentSignalStrength: 0,
  hasEmail: false,
  hasPhone: false,
  industryMatch: true,
});
assert(!('poorPerformance' in blockedScore.factors), 'performanceScore removed from scoring');

const noWebsiteScore = computeLeadScore({
  hasWebsite: false,
  httpsEnabled: null,
  mobileFriendly: null,
  intentSignalStrength: 0,
  hasEmail: false,
  hasPhone: false,
  industryMatch: true,
});
assert(noWebsiteScore.factors.noWebsite === 20, 'no website still scores opportunity');
assert(noWebsiteScore.reachability === 'none', 'no website without contact is not reachable');

async function testBlockedCrawl() {
  const service = new CrawlService();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () =>
    new Response('Forbidden', { status: 403, statusText: 'Forbidden' });

  const result = await service.crawlWebsite('https://blocked-example.com');
  assert(result.crawlStatus === 'blocked', '403 marked as blocked');
  assert(result.hasWebsite === true, 'blocked site still hasWebsite true');

  globalThis.fetch = originalFetch;
}

async function testContactEmailMerge() {
  const service = new CrawlService();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/contact')) {
      return new Response('<html><body><a href="mailto:found@contact.test">x</a></body></html>', {
        status: 200,
      });
    }
    return new Response(
      '<html><head><meta name="viewport" content="width=device-width"></head><body><a href="/contact">Contact</a></body></html>',
      { status: 200 },
    );
  };

  const result = await service.crawlWebsite('https://contact-merge.test');
  assert(result.extractedEmail === 'found@contact.test', 'contact page email extracted');
  assert(result.pagesFetched >= 2, 'fetches homepage and contact');

  globalThis.fetch = originalFetch;
}

(async () => {
  if (!process.env.DATABASE_URL) {
    console.log('skip crawl fetch integration tests (DATABASE_URL not set)');
  } else {
    const { platformSettings } = await import('@agency/settings');
    await platformSettings.ensureLoaded();
    await platformSettings.updateCrawl({ trackBudget: false });
    await testBlockedCrawl();
    await testContactEmailMerge();
  }
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
