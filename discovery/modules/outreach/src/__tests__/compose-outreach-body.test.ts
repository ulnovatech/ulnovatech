import { composeOutreachBody } from '../compose-outreach-body';

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

assert(
  composeOutreachBody('Template body', null) === 'Template body',
  'null opener returns template only',
);
assert(
  composeOutreachBody('Template body', '  ') === 'Template body',
  'blank opener returns template only',
);
assert(
  composeOutreachBody('Hi there', 'Personal intro').startsWith('Personal intro'),
  'prepends opener with blank line',
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
