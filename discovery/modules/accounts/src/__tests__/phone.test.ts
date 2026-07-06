import { MIN_PHONE_DIGITS, normalizePhoneDigits } from '../phone';

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

assert(normalizePhoneDigits('+256 700 000 000') === '256700000000', 'phone: strips formatting');
assert(normalizePhoneDigits('(555) 020-0100') === '5550200100', 'phone: US formatting');
assert(normalizePhoneDigits('12345') === null, 'phone: too short rejected');
assert(normalizePhoneDigits('') === null, 'phone: empty rejected');
assert(MIN_PHONE_DIGITS === 7, 'phone: min digits threshold');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
