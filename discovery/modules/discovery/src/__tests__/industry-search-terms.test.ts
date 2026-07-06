import { buildProspectSearchQueries } from '../lib/build-prospect-search-queries';
import { buildPublicSearchQueries } from '../lib/build-public-search-queries';
import { buildCitySearchQueries, buildTextQuery } from '../lib/build-search-query';
import { buildMetaSearchQueries } from '../lib/build-meta-search-queries';
import {
  expandIndustryTerms,
  industrySynonymsFor,
  INDUSTRY_SEARCH_TERMS,
} from '../lib/industry-search-terms';
import { prospectQueryRatio } from '@agency/config';

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

const kampalaRestaurant = { country: 'Uganda', city: 'Kampala', industry: 'Restaurant' };
const salonParams = { country: 'Uganda', city: 'Kampala', industry: 'Salon & Spa' };

assert(
  Object.keys(INDUSTRY_SEARCH_TERMS).length >= 20,
  'synonym map covers default industries',
);

const salonTerms = expandIndustryTerms('Salon & Spa', 3);
assert(salonTerms[0] === 'Salon & Spa', 'primary industry term first');
assert(salonTerms.some((t) => t.toLowerCase().includes('salon')), 'salon synonym included');
assert(salonTerms.length <= 3, 'expandIndustryTerms respects max');

const unknown = expandIndustryTerms('Custom Niche', 3);
assert(unknown.length === 1 && unknown[0] === 'Custom Niche', 'unknown industry returns primary only');

assert(industrySynonymsFor('Dental').includes('dentist'), 'industrySynonymsFor lookup');

const prospect = buildProspectSearchQueries({
  params: salonParams,
  terms: ['hair salon'],
  maxQueries: 4,
});
assert(prospect.some((q) => q.includes('site:facebook.com')), 'prospect queries include facebook site');
assert(prospect.some((q) => q.includes('no website')), 'prospect queries include no website angle');
assert(prospect.every((q) => q.includes('-jobs')), 'prospect queries include negative keywords');

const publicQueries = buildPublicSearchQueries(salonParams, 15);
assert(publicQueries.length <= 15, 'public search respects max');
assert(publicQueries.some((q) => q.includes('site:facebook.com')), 'public search includes prospect templates');
assert(
  publicQueries.some((q) => q.includes('hair salon') || q.includes('Salon')),
  'public search uses synonym terms',
);

const ratio = prospectQueryRatio();
assert(ratio >= 0.1 && ratio <= 0.85, 'prospectQueryRatio in valid range');

const placesSingle = buildCitySearchQueries({
  ...kampalaRestaurant,
  acquisitionMode: 'standard',
});
assert(placesSingle.length >= 1, 'places single city yields queries');
assert(placesSingle[0]?.includes('Restaurant'), 'places query includes industry');

const placesBoost = buildCitySearchQueries({
  ...kampalaRestaurant,
  acquisitionMode: 'boost',
});
assert(placesBoost.length >= 1, 'places boost may add synonym query');

const countryWide = buildTextQuery({
  country: 'Uganda',
  city: 'All cities',
  industry: 'Restaurant',
});
assert(countryWide.includes('Uganda'), 'all cities text query uses country');

const meta = buildMetaSearchQueries(kampalaRestaurant, 10);
assert(meta.some((q) => q.includes('Restaurant') || q.includes('restaurant')), 'meta queries include food terms');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
