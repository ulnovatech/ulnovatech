import { assertLeadCanCloseDeal } from '../rules';

let passed = 0;
let failed = 0;

function assertNoThrow(fn: () => void, name: string) {
  try {
    fn();
    passed++;
    console.log(`ok ${name}`);
  } catch {
    failed++;
    console.error(`fail ${name}`);
  }
}

function assertThrows(fn: () => void, name: string) {
  try {
    fn();
    failed++;
    console.error(`fail ${name}`);
  } catch {
    passed++;
    console.log(`ok ${name}`);
  }
}

assertNoThrow(() => assertLeadCanCloseDeal('PROPOSAL_SENT'), 'PROPOSAL_SENT can close');
assertThrows(() => assertLeadCanCloseDeal('QUALIFIED'), 'QUALIFIED cannot close');
assertThrows(() => assertLeadCanCloseDeal('CONTACTED'), 'CONTACTED cannot close');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
