import { parseCsvContent, normalizeCsvHeader } from '../lib/parse-csv';

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

assert(normalizeCsvHeader(' Business Name ') === 'business_name', 'normalizes header labels');

const simple = parseCsvContent('name,industry\nAcme,dentist\n');
assert(simple.dataRowCount === 1 && simple.rows[0].name === 'Acme', 'parses simple csv');

const quoted = parseCsvContent('name,notes\n"Acme, LLC","Says ""hello"""\n');
assert(
  quoted.rows[0].name === 'Acme, LLC' && quoted.rows[0].notes === 'Says "hello"',
  'handles quoted commas and escaped quotes',
);

const bom = parseCsvContent('\uFEFFname,city\nShop,Austin\n');
assert(bom.rows[0].name === 'Shop', 'strips utf8 bom');

const aliases = parseCsvContent('Company Name,Category\nBeta Co,plumber\n');
assert(aliases.rows[0].company_name === 'Beta Co', 'normalizes spaced headers');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
