import {
  extractBusinessDomain,
  extractDomainFromEmail,
  extractDomainFromWebsite,
  isGenericOrSocialHost,
} from '../domain';

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

assert(extractDomainFromWebsite('https://www.joespizza.com/menu') === 'joespizza.com', 'domain: website path');
assert(extractDomainFromWebsite('joespizza.com') === 'joespizza.com', 'domain: bare host');
assert(extractDomainFromEmail('Owner@JoePizza.COM') === 'joepizza.com', 'domain: email lowercases');
assert(isGenericOrSocialHost('gmail.com'), 'domain: gmail generic');
assert(isGenericOrSocialHost('facebook.com'), 'domain: facebook social');
assert(
  extractBusinessDomain({ email: 'info@gmail.com', website: '' }) === null,
  'domain: generic email ignored',
);
assert(
  extractBusinessDomain({ website: 'https://metrolegal.example' }) === 'metrolegal.example',
  'domain: business website used',
);
assert(
  extractBusinessDomain({ email: 'contact@metrolegal.example' }) === 'metrolegal.example',
  'domain: business email used',
);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
