import { computeCategoryMetrics } from '../scoring/category.metrics';
import { scoreListing } from '../scoring/gap.scorer';
import { detectGhost, filterGhosts } from '../scoring/ghost.filter';
import { checkVisibility, isEligibleForActionCard } from '../scoring/visibility.checker';
import {
  codecanyonMechanics,
  emptyComplaints,
  fixtureListings,
  ghostListing,
  gumroadMechanics,
  SCORING_AS_OF,
  type2Complaints,
  type2Listing,
  type3Listing,
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

const ghostVerdict = detectGhost(ghostListing, { asOf: SCORING_AS_OF });
assert(ghostVerdict.isGhost, 'ghost listing detected');
assert(ghostVerdict.reasons.length > 0, 'ghost listing has reasons');

const { passed: afterGhost, ghosts } = filterGhosts(fixtureListings, { asOf: SCORING_AS_OF });
assert(ghosts.length === 1, 'one ghost filtered from fixtures');
assert(afterGhost.length === 2, 'two non-ghost listings remain');
assert(!afterGhost.some((l) => l.id === ghostListing.id), 'ghost excluded before scoring');

const type2Score = scoreListing(type2Listing, type2Complaints, codecanyonMechanics, {
  asOf: SCORING_AS_OF,
});
const type3Score = scoreListing(type3Listing, emptyComplaints, codecanyonMechanics, {
  asOf: SCORING_AS_OF,
});

assert(type2Score.type === 'TYPE_2', 'type2 listing classified TYPE_2');
assert(type3Score.type === 'TYPE_3', 'type3 stale listing classified TYPE_3');
assert(type2Score.score > type3Score.score, 'TYPE_2 scores higher than TYPE_3 stale listing');

const gumroadVisibility = checkVisibility('gumroad', gumroadMechanics, 120);
assert(gumroadVisibility.risk === 'HIGH', 'gumroad mechanics yield HIGH visibility risk');
assert(gumroadVisibility.willSurface === false, 'gumroad willSurface false');
assert(
  !isEligibleForActionCard('TYPE_2', gumroadVisibility),
  'TYPE_2 on gumroad excluded from action cards',
);

const codecanyonVisibility = checkVisibility('codecanyon', codecanyonMechanics, 200);
assert(codecanyonVisibility.risk === 'LOW', 'codecanyon small category yields LOW risk');
assert(
  isEligibleForActionCard(type2Score.type, codecanyonVisibility),
  'TYPE_2 on codecanyon eligible for cards',
);

const metrics = computeCategoryMetrics(fixtureListings, { asOf: SCORING_AS_OF });
assert(metrics.listingCount === 3, 'category metrics count all listings');
assert(metrics.ghostCount === 1, 'category metrics track ghosts');
assert(metrics.avgSales > 0, 'avg sales computed from non-ghost listings');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
