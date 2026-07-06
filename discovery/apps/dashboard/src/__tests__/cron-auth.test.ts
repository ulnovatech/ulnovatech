import { isCronAuthorized } from '@/lib/cron-auth';

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

const prev = process.env.CRON_SECRET;
process.env.CRON_SECRET = 'test-secret';

const bearerOk = new Request('http://localhost/api/intent/rss/poll', {
  method: 'POST',
  headers: { authorization: 'Bearer test-secret' },
});
const headerOk = new Request('http://localhost/api/intent/rss/poll', {
  method: 'POST',
  headers: { 'x-cron-secret': 'test-secret' },
});
const bad = new Request('http://localhost/api/intent/rss/poll', {
  method: 'POST',
  headers: { authorization: 'Bearer wrong' },
});

assert(isCronAuthorized(bearerOk), 'cron: bearer secret accepted');
assert(isCronAuthorized(headerOk), 'cron: x-cron-secret accepted');
assert(!isCronAuthorized(bad), 'cron: wrong secret rejected');

process.env.CRON_SECRET = '';
assert(!isCronAuthorized(bearerOk), 'cron: missing CRON_SECRET env rejects');

if (prev === undefined) delete process.env.CRON_SECRET;
else process.env.CRON_SECRET = prev;

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
