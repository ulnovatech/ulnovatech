import { canTransition, getAllowedTransitions } from '@agency/crm';
import { assertLeadCanSendProposal } from '@agency/proposal';
import { assertLeadCanCloseDeal } from '@agency/revenue';
import { computeLeadScore } from '@agency/scoring';

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

assert(canTransition('NEW', 'REVIEWED') === true, 'NEW -> REVIEWED');
assert(canTransition('NEW', 'CONTACTED') === true, 'NEW -> CONTACTED');
assert(canTransition('NEW', 'CLOSED_WON') === false, 'NEW -> CLOSED_WON blocked');
assert(getAllowedTransitions('PROPOSAL_SENT').includes('CLOSED_LOST'), 'proposal can close lost');
assert(canTransition('CONTACTED', 'CLOSED_LOST') === true, 'CONTACTED can close lost');
assert(canTransition('NO_RESPONSE', 'CLOSED_LOST') === true, 'NO_RESPONSE can close lost');
assert(canTransition('QUALIFIED', 'PROPOSAL_SENT') === true, 'QUALIFIED -> PROPOSAL_SENT');
assert(canTransition('PROPOSAL_SENT', 'CLOSED_WON') === true, 'PROPOSAL_SENT -> CLOSED_WON');

let funnelOk = true;
try {
  assertLeadCanSendProposal('QUALIFIED');
  assertLeadCanCloseDeal('PROPOSAL_SENT');
} catch {
  funnelOk = false;
}
assert(funnelOk, 'proposal/revenue funnel rules allow happy path');

const score = computeLeadScore({
  hasWebsite: false,
  httpsEnabled: null,
  mobileFriendly: null,
  intentSignalStrength: 0,
  hasEmail: true,
  hasPhone: false,
  industryMatch: true,
});
assert(score.score > 40, 'no-website scores high');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
