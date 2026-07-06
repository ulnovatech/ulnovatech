import { mapCsvRowsToCandidates, rowMatchesRunFilters } from '../lib/map-csv-row';

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

const params = { country: 'United States', city: 'Austin', industry: 'dentist' };
const isAllCities = (city: string) => city.toLowerCase() === 'all cities';

const rows = [
  { name: 'Good Dental', industry: 'dentist', city: 'Austin', country: 'United States' },
  { business: 'Wrong City', industry: 'dentist', city: 'Dallas', country: 'United States' },
  { company: 'No Industry Row', city: 'Austin', country: 'United States' },
];

const { candidates, filteredOut } = mapCsvRowsToCandidates(rows, params, isAllCities);
assert(candidates.length === 2 && filteredOut === 1, 'filters city mismatch and keeps matching rows');
assert(candidates[0].name === 'Good Dental' && candidates[0].source === 'csv_import', 'maps business fields');

assert(
  rowMatchesRunFilters(
    { industry: 'family dentist', country: 'United States', city: 'Austin' },
    params,
    isAllCities,
  ),
  'loose industry match',
);

const allCitiesParams = { ...params, city: 'All cities' };
assert(
  mapCsvRowsToCandidates(
    [{ name: 'Remote Co', industry: 'dentist', country: 'United States', city: 'Dallas' }],
    allCitiesParams,
    isAllCities,
  ).candidates.length === 1,
  'all cities allows any row city',
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
