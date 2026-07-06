import { hashSourceUrl, parseProspectFromSignal } from '../parse-prospect';

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

const fromTitle = parseProspectFromSignal({ title: '[Hiring] Acme Dental — need website help' });
assert(fromTitle.name.includes('Acme Dental'), 'strips bracket prefix from title');

const override = parseProspectFromSignal({ title: 'Generic post' }, { name: 'Custom Name' });
assert(override.name === 'Custom Name', 'input name overrides parsed title');

const fromSnippet = parseProspectFromSignal({ snippet: 'Looking for: Riverside Gym rebuild' });
assert(fromSnippet.name.includes('Riverside Gym'), 'parses name from snippet');

const hashA = hashSourceUrl('https://example.com/post/1');
const hashB = hashSourceUrl('HTTPS://EXAMPLE.COM/post/1');
assert(hashA === hashB, 'source URL hash is case-insensitive');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
