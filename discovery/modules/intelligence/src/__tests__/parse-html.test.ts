import { discoverExtraPageUrls } from '../crawl/link-discovery';
import { extractMailto, extractJsonLdContacts, parseHtmlPage } from '../crawl/parse-html';

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

const opts = {
  extraPaths: ['/about'],
  contactKeywords: ['custom-contact'],
  aboutKeywords: ['custom-about'],
  locales: { useBuiltinLexicon: true, packs: [] },
  maxExtra: 5,
};

const homepage = `
<html><head>
<title>Joe's Cafe</title>
<meta name="viewport" content="width=device-width">
<meta name="description" content="Best food in town">
<script type="application/ld+json">{"@type":"Organization","email":"info@joescafe.com","telephone":"+256700111222"}</script>
</head><body>
<a href="/contact">Contact</a>
<a href="https://facebook.com/joescafe">FB</a>
<a href="mailto:hello@joescafe.com">Email us</a>
</body></html>`;

const contactPage = `
<html><body>
<a href="mailto:contact@joescafe.com">Reach us</a>
<a href="tel:+256700999888">Call</a>
</body></html>`;

assert(extractMailto(contactPage) === 'contact@joescafe.com', 'extracts mailto from contact page');

const jsonLd = extractJsonLdContacts(homepage);
assert(jsonLd.email === 'info@joescafe.com', 'extracts JSON-LD email');
assert(jsonLd.phone === '+256700111222', 'extracts JSON-LD phone');

const parsed = parseHtmlPage(homepage, 'https://joescafe.com');
assert(parsed.title === "Joe's Cafe", 'parses title');
assert(parsed.mobileFriendly === true, 'detects viewport');
assert(parsed.email === 'hello@joescafe.com', 'prefers visible mailto over json-ld');

const extras = discoverExtraPageUrls(homepage, 'https://joescafe.com', opts);
assert(extras.some((u) => u.includes('/contact')), 'discovers contact link via intent');

const variedNav = `
<nav>
  <a href="/pages/contact-us">Contact Us</a>
  <a href="/get-in-touch">Get In Touch</a>
  <a href="/reach-out">Reach Out</a>
</nav>
<a href="/random-menu">Menu</a>`;

const varied = discoverExtraPageUrls(variedNav, 'https://example.com', {
  ...opts,
  extraPaths: [],
  maxExtra: 3,
});
assert(varied.some((u) => u.includes('contact-us')), 'finds nested contact-us path');
assert(varied.some((u) => u.includes('get-in-touch')), 'finds get-in-touch');
assert(!varied.some((u) => u.includes('random-menu')), 'filters low-intent menu link');

const anchorOnly = `
<footer>
  <a href="/p/42">Get in Touch</a>
  <a href="/company-info">About our company</a>
</footer>`;

const byText = discoverExtraPageUrls(anchorOnly, 'https://shop.test', {
  ...opts,
  extraPaths: [],
  maxExtra: 2,
});
assert(byText.some((u) => u.includes('/p/42')), 'matches contact intent from anchor text');
assert(byText.some((u) => u.includes('/company-info')), 'matches about intent from anchor text');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
