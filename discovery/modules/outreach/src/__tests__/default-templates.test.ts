import { DEFAULT_OUTREACH_TEMPLATES, OUTREACH_OPPORTUNITY_TYPES } from '../default-templates';

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

assert(DEFAULT_OUTREACH_TEMPLATES.length === 5, 'five default templates');
assert(OUTREACH_OPPORTUNITY_TYPES.length === 5, 'five opportunity types');
assert(
  new Set(OUTREACH_OPPORTUNITY_TYPES).size === 5,
  'opportunity types are unique',
);
assert(
  DEFAULT_OUTREACH_TEMPLATES.every((t) => t.body.includes('{{business}}')),
  'all templates include business token',
);
assert(
  DEFAULT_OUTREACH_TEMPLATES.some((t) => t.opportunityType === 'demand_response'),
  'demand response template exists',
);

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed`);
