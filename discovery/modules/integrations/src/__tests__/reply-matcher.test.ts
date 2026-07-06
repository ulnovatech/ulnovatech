import { matchLeadForInboundReply, parseEmailAddress, normalizeSubject } from '../reply-matcher';

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

assert(parseEmailAddress('Acme <info@acme.com>') === 'info@acme.com', 'parse bracket email');
assert(parseEmailAddress('info@acme.com') === 'info@acme.com', 'parse plain email');
assert(normalizeSubject('Re: Proposal follow-up') === 'proposal follow-up', 'normalize re subject');

const leads = [
  {
    id: 'lead-1',
    status: 'CONTACTED',
    businessEmail: 'info@acme.com',
    outreachSubjects: ['Web proposal for Acme'],
  },
  {
    id: 'lead-2',
    status: 'REVIEWED',
    businessEmail: 'info@acme.com',
    outreachSubjects: [],
  },
];

assert(
  matchLeadForInboundReply('info@acme.com', 'Thanks!', leads) === 'lead-1',
  'matches contacted lead by email',
);
assert(
  matchLeadForInboundReply('other@x.com', 'Hi', leads) === null,
  'no match for unknown sender',
);
assert(
  matchLeadForInboundReply('Bob <info@acme.com>', 'Re: Web proposal for Acme', leads) === 'lead-1',
  'subject thread helps disambiguate',
);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
