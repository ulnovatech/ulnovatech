import {
  buildBusinessSignalsFromReviews,
  extractReviewSnippets,
  mineReviewPainKeywords,
  normalizePlacesReviews,
  readPlacesReviewsFromMetadata,
  reviewPainSourceUrl,
} from '../providers/places/review-pain-signals';

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

const reviews = normalizePlacesReviews([
  { text: { text: 'Love the food but they have no website and it is hard to book online.' }, rating: 3 },
  { text: 'Great staff', rating: 5 },
]);

assert(reviews.length === 2, 'normalizes nested Places review text');
assert(reviews[0]?.text?.includes('no website'), 'preserves review body');

const snippets = extractReviewSnippets(reviews, 3);
assert(snippets.length === 2, 'extracts snippets');
assert(snippets[0]?.source === 'google_places', 'snippet source is google_places');

const pain = mineReviewPainKeywords(snippets);
assert(pain.some((p) => p.keyword === 'no_website'), 'detects no_website pain');
assert(pain.some((p) => p.keyword === 'hard_to_book'), 'detects hard_to_book pain');
assert(pain[0]!.signalStrength >= pain[pain.length - 1]!.signalStrength, 'pain sorted by strength');

const signals = buildBusinessSignalsFromReviews(reviews);
assert(signals.reviewSnippets.length === 2, 'buildBusinessSignalsFromReviews snippets');
assert(signals.painKeywords.length >= 2, 'buildBusinessSignalsFromReviews pain');

const fromMeta = readPlacesReviewsFromMetadata({
  reviews: [{ text: 'Outdated website needs a refresh', rating: 2 }],
});
assert(fromMeta.length === 1, 'readPlacesReviewsFromMetadata from reviews key');

const fromSnippets = readPlacesReviewsFromMetadata({
  reviewSnippets: [{ text: 'Cannot find their menu online', rating: 4 }],
});
assert(fromSnippets.length === 1, 'readPlacesReviewsFromMetadata falls back to reviewSnippets');

assert(
  reviewPainSourceUrl('biz-1', 'no_website') === 'places_review_pain:biz-1:no_website',
  'reviewPainSourceUrl stable dedupe key',
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
