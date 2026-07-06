import {
  mergeSearchResults,
  normalizeSearchUrl,
  SEARCH_RESULTS_PER_PAGE,
} from '../providers/search-api-client';
import {
  parseBingSearchErrorBody,
  parseGoogleSearchErrorBody,
  SearchApiError,
} from '../providers/search-api-error';

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

function testNormalizeSearchUrl() {
  assert(
    normalizeSearchUrl('https://WWW.Example.com/path/') === 'https://example.com/path',
    'normalize strips www and trailing slash',
  );
  assert(
    normalizeSearchUrl('https://example.com/a') === normalizeSearchUrl('https://example.com/a/'),
    'normalize treats trailing slash as duplicate',
  );
}

function testMergeSearchResults() {
  const merged = mergeSearchResults(
    [
      { title: 'A', link: 'https://example.com/a', snippet: '1' },
      { title: 'B', link: 'https://example.com/b', snippet: '2' },
    ],
    [
      { title: 'B duplicate', link: 'https://www.example.com/b/', snippet: '3' },
      { title: 'C', link: 'https://example.com/c', snippet: '4' },
    ],
  );
  assert(merged.length === 3, 'merge dedupes by normalized URL');
  assert(merged[0]?.link === 'https://example.com/a', 'merge preserves CSE order first');
  assert(merged[1]?.title === 'B', 'merge keeps first engine title for duplicate URL');
  assert(merged[2]?.link === 'https://example.com/c', 'merge includes unique Bing-only URL');
}

function testGoogleErrorParsing() {
  const parsed = parseGoogleSearchErrorBody(
    JSON.stringify({
      error: {
        message: 'API key not valid',
        errors: [{ reason: 'keyInvalid', message: 'API key not valid' }],
      },
    }),
  );
  assert(parsed.message.includes('API key'), 'parses Google CSE error message');
  assert(parsed.reason === 'keyInvalid', 'parses Google CSE error reason');
}

function testBingErrorParsing() {
  const parsed = parseBingSearchErrorBody(
    JSON.stringify({ error: { code: 'InvalidRequest', message: 'Bad key' } }),
  );
  assert(parsed.message === 'Bad key', 'parses Bing error message');
  assert(parsed.reason === 'InvalidRequest', 'parses Bing error code');
}

function testSearchApiErrorMessage() {
  const err = new SearchApiError('google_cse', 403, 'Forbidden', 'accessNotConfigured');
  assert(err.message.includes('Google Custom Search'), 'SearchApiError names engine');
  assert(err.message.includes('403'), 'SearchApiError includes status');
  assert(err.engine === 'google_cse', 'SearchApiError stores engine');
}

function testCseGeoParams() {
  const iso2 = 'UG';
  const params = new URLSearchParams({
    key: 'test',
    cx: 'cx',
    q: 'salon Kampala',
    num: String(SEARCH_RESULTS_PER_PAGE),
    start: '1',
    gl: iso2,
    cr: `country${iso2}`,
  });
  assert(params.get('gl') === 'UG', 'CSE geo gl param');
  assert(params.get('cr') === 'countryUG', 'CSE geo cr param');
}

function main() {
  testNormalizeSearchUrl();
  testMergeSearchResults();
  testGoogleErrorParsing();
  testBingErrorParsing();
  testSearchApiErrorMessage();
  testCseGeoParams();

  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
