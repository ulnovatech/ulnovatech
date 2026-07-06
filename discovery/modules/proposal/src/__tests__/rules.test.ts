import { assertLeadCanCreateProposal, assertLeadCanSendProposal } from '../rules';

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

assertNoThrow(() => assertLeadCanCreateProposal('QUALIFIED'), 'QUALIFIED can create');
assertThrows(() => assertLeadCanCreateProposal('REPLIED'), 'REPLIED blocked without autoQualify');
assertNoThrow(() => assertLeadCanCreateProposal('REPLIED', true), 'REPLIED with autoQualify');
assertThrows(() => assertLeadCanCreateProposal('CONTACTED'), 'CONTACTED blocked');

assertNoThrow(() => assertLeadCanSendProposal('QUALIFIED'), 'QUALIFIED can send');
assertThrows(() => assertLeadCanSendProposal('REPLIED'), 'REPLIED cannot send');
assertThrows(() => assertLeadCanSendProposal('PROPOSAL_SENT'), 'already sent blocked');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
