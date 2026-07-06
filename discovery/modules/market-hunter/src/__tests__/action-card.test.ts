import { generateActionCard, rerankActionCards } from '../output/action-card';
import { listingKey } from '../platforms/base.adapter';
import { checkVisibility } from '../scoring/visibility.checker';
import { scoreListing } from '../scoring/gap.scorer';
import {
  codecanyonMechanics,
  type2Complaints,
  type2Listing,
  SCORING_AS_OF,
} from './fixtures/scoring-listings';

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

const gap = scoreListing(type2Listing, type2Complaints, codecanyonMechanics, { asOf: SCORING_AS_OF });
const visibility = checkVisibility('codecanyon', codecanyonMechanics, 120);

const card = generateActionCard({
  listing: type2Listing,
  gapScore: gap,
  complaints: type2Complaints,
  visibility,
  platform: 'codecanyon',
  rank: 1,
  listingKey: listingKey(type2Listing),
});

assert(card.gapType === 'TYPE_2', 'action card gap type TYPE_2');
assert(card.originalUrl === type2Listing.url, 'card references originalUrl');
assert(card.buildSpec.differentiators.length > 0, 'TYPE_2 card has differentiators');
assert(card.approvedForBuild === false, 'cards start unapproved');

const reranked = rerankActionCards([
  { ...card, rank: 2, gapScore: 30 },
  { ...card, rank: 1, gapScore: 90, originalProduct: 'Higher score product' },
]);
assert(reranked[0]?.gapScore === 90, 'cards reranked by gap score');
assert(reranked[0]?.rank === 1, 'rank updated after rerank');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
