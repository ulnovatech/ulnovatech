import { discoverExtraPageUrls } from '../crawl/link-discovery';

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

const locales = { useBuiltinLexicon: true, packs: [] };

const html = `
<nav>
  <a href="/contact-us">Contact</a>
  <a href="/wp/contactus">Contact Us</a>
  <a href="/get-in-touch">Touch</a>
</nav>
<a href="https://other.com/contact">External</a>
<footer><a href="/our-story">Story</a></footer>
`;

const found = discoverExtraPageUrls(html, 'https://biz.com', {
  extraPaths: [],
  contactKeywords: [],
  aboutKeywords: [],
  locales,
  maxExtra: 5,
});

assert(found.some((u) => u.includes('contact-us')), 'contact-us via intent');
assert(found.some((u) => u.includes('contactus')), 'contactus variant');
assert(found.some((u) => u.includes('get-in-touch')), 'get-in-touch');
assert(found.some((u) => u.includes('our-story')), 'about story');
assert(!found.some((u) => u.includes('other.com')), 'skips external domain');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
