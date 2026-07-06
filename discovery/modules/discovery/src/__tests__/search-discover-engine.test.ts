import type { SearchResultItem } from '../providers/parse-search-results';
import type { SearchApiCallError, SearchQueryResult } from '../providers/search-api-client';
import { runParallelSearchDiscover } from '../providers/search-discover-engine';
import type { DiscoveredBusiness, DiscoverySearchParams } from '../providers/types';

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockSearchClient {
  readonly calls: string[] = [];
  maxInFlight = 0;
  private inFlight = 0;

  constructor(
    private readonly responder: (query: string) => SearchResultItem[],
    private readonly delayMs = 15,
  ) {}

  isConfigured() {
    return true;
  }

  async searchQuery(query: string, _opts: { maxPages: number; country: string }): Promise<SearchQueryResult> {
    this.calls.push(query);
    this.inFlight++;
    this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
    await sleep(this.delayMs);
    this.inFlight--;
    return {
      items: this.responder(query),
      cseCalls: 1,
      bingCalls: 0,
      budgetExhausted: false,
      errors: [] as SearchApiCallError[],
    };
  }
}

const params: DiscoverySearchParams = {
  country: 'Uganda',
  city: 'Kampala',
  industry: 'Restaurant',
};

async function testEarlyExit() {
  const client = new MockSearchClient(() => [
    {
      title: 'Joe Kitchen',
      link: `https://example.com/${Math.random()}`,
      snippet: 'local',
    },
  ]);

  const stats = await runParallelSearchDiscover({
    params,
    queries: ['q1', 'q2', 'q3', 'q4', 'q5'],
    maxPages: 1,
    logContext: 'test_early_exit',
    client: client as unknown as import('../providers/search-api-client').SearchApiClient,
    target: 2,
    concurrency: 3,
    parseItem: (item, query) => ({
      name: item.title,
      country: params.country,
      city: params.city,
      industry: params.industry,
      source: 'public_search',
      externalId: `search:${item.link}`,
      metadata: { searchQuery: query },
    }),
  });

  assert(stats.businesses.length === 2, 'early exit stops at target');
  assert(stats.targetReached === true, 'targetReached flagged');
  assert(stats.queriesExecuted < stats.queriesPlanned, 'not all queries run after target');
}

async function testParallelConcurrency() {
  const client = new MockSearchClient(
    (query) => [{ title: query, link: `https://example.com/${query}`, snippet: '' }],
    40,
  );

  await runParallelSearchDiscover({
    params,
    queries: ['a', 'b', 'c', 'd', 'e', 'f'],
    maxPages: 1,
    logContext: 'test_concurrency',
    client: client as unknown as import('../providers/search-api-client').SearchApiClient,
    target: 100,
    concurrency: 3,
    parseItem: (item, query) => ({
      name: item.title,
      country: params.country,
      source: 'public_search',
      externalId: `search:${item.link}`,
      metadata: { searchQuery: query },
    }),
  });

  assert(client.maxInFlight >= 2, 'queries run with parallel in-flight work');
  assert(client.maxInFlight <= 3, 'concurrency cap respected');
}

async function testDedupeAcrossQueries() {
  const client = new MockSearchClient(() => [
    { title: 'Same Biz', link: 'https://www.example.com/page/', snippet: '' },
  ]);

  const stats = await runParallelSearchDiscover({
    params,
    queries: ['q1', 'q2'],
    maxPages: 1,
    logContext: 'test_dedupe',
    client: client as unknown as import('../providers/search-api-client').SearchApiClient,
    target: 10,
    concurrency: 2,
    parseItem: (item, query) => ({
      name: item.title,
      source: 'public_search',
      externalId: `search:${item.link.replace(/\/$/, '')}`,
      metadata: { searchQuery: query },
    }),
  });

  assert(stats.businesses.length === 1, 'dedupes identical URLs across parallel queries');
}

async function main() {
  await testEarlyExit();
  await testParallelConcurrency();
  await testDedupeAcrossQueries();
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
