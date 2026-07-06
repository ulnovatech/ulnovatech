import { canTransition, getAllowedTransitions, isTerminalLeadStatus } from '../state-machine';

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

assert(canTransition('REVIEWED', 'CONTACTED') === true, 'REVIEWED -> CONTACTED');
assert(canTransition('PROPOSAL_SENT', 'CLOSED_LOST') === true, 'PROPOSAL_SENT -> CLOSED_LOST');
assert(canTransition('QUALIFIED', 'CLOSED_LOST') === true, 'QUALIFIED -> CLOSED_LOST');
assert(canTransition('REPLIED', 'CLOSED_LOST') === true, 'REPLIED -> CLOSED_LOST');
assert(canTransition('CONTACTED', 'CLOSED_LOST') === true, 'CONTACTED -> CLOSED_LOST');
assert(canTransition('CONTACTED', 'REPLIED') === true, 'CONTACTED -> REPLIED');
assert(canTransition('NO_RESPONSE', 'CLOSED_LOST') === true, 'NO_RESPONSE -> CLOSED_LOST');
assert(canTransition('NO_RESPONSE', 'REPLIED') === true, 'NO_RESPONSE -> REPLIED');
assert(canTransition('REVIEWED', 'REPLIED') === false, 'REVIEWED -> REPLIED blocked');

const fromNew = getAllowedTransitions('NEW');
assert(fromNew.includes('CONTACTED'), 'NEW allows CONTACTED');
assert(!fromNew.includes('CLOSED_WON'), 'NEW excludes CLOSED_WON');

assert(isTerminalLeadStatus('CLOSED_LOST') === true, 'CLOSED_LOST is terminal');
assert(isTerminalLeadStatus('CONTACTED') === false, 'CONTACTED is active');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
