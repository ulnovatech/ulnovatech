import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extractGrokResponseText,
  normalizeGrokListing,
  parseGrokJsonContent,
  validateGrokListingsPayload,
  validateGrokReviewTexts,
} from '../research/grok.parser';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, 'fixtures');

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

const listingsFixture = JSON.parse(
  readFileSync(join(fixtures, 'grok-listings-array.json'), 'utf8'),
);
const envelopeFixture = JSON.parse(
  readFileSync(join(fixtures, 'grok-responses-envelope.json'), 'utf8'),
);

const validated = validateGrokListingsPayload(listingsFixture);
assert(validated.length === 2, 'fixture validates two listings');
assert(validated[0]?.salesCount === 1200, 'salesCount preserved');

const normalized = normalizeGrokListing(validated[0]!, 'codecanyon', 'mobile/react-native');
assert(normalized.platform === 'codecanyon', 'normalized platform key');
assert(normalized.id === '12345678', 'listing id parsed from codecanyon url');
assert(normalized.lastUpdatedDate instanceof Date, 'lastUpdatedDate is Date');

const envelopeText = extractGrokResponseText(envelopeFixture);
const fromEnvelope = validateGrokListingsPayload(parseGrokJsonContent(envelopeText));
assert(fromEnvelope.length === 1, 'responses envelope extracts one listing');

try {
  validateGrokListingsPayload([]);
  assert(false, 'empty array should throw');
} catch {
  assert(true, 'empty array throws GrokParseError');
}

const reviews = validateGrokReviewTexts(['Great app', 'Needs dark mode']);
assert(reviews.length === 2, 'review validator accepts string array');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
