import { parseProspectFromSignal } from '../parse-prospect';

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

// Orphan paste → createProspect path uses parse + demand_inbox source (integration in API).
const orphan = parseProspectFromSignal(
  { title: "Need marketing help for Joe's Pizza", snippet: 'Brooklyn NY' },
  { city: 'Brooklyn', country: 'United States' },
);
assert(orphan.name.includes('Joe'), 'orphan flow derives business name from signal title');
assert(orphan.city === 'Brooklyn', 'orphan flow keeps geo from operator input');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
