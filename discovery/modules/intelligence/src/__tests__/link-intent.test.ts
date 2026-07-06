import { buildEffectiveLexicons } from '../crawl/effective-lexicon';
import { extractLinksWithContext } from '../crawl/link-extract';
import { scoreLinkIntent, tokenize } from '../crawl/link-intent';
import { discoverExtraPageUrls } from '../crawl/link-discovery';
import type { LocaleSettings } from '@agency/settings';

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

const defaultLocales: LocaleSettings = { useBuiltinLexicon: true, packs: [] };
const lexicons = () => buildEffectiveLexicons(defaultLocales, [], []);

assert(tokenize('Get-In-Touch').includes('touch'), 'tokenizes hyphenated text');
assert(tokenize('contactUs').includes('contact'), 'tokenizes camelCase');
assert(tokenize('اتصل بنا').includes('اتصل'), 'tokenizes Arabic script');

const navHtml = `
<nav>
  <a href="/p/99" aria-label="Nous contacter">FR</a>
  <a href="/kontakt">Kontakt</a>
</nav>
<footer>
  <a href="/company/our-story">Our Story</a>
</footer>
<a href="/menu">Menu</a>
`;

const links = extractLinksWithContext(navHtml);
const frLink = links.find((l) => l.href === '/p/99');
assert(frLink?.inNav === true, 'detects nav context');

const frScore = scoreLinkIntent(frLink!, '/p/99', lexicons());
assert(frScore.contact > frScore.about, 'French contact aria scores contact intent');

const arabicLocales: LocaleSettings = {
  useBuiltinLexicon: false,
  packs: [
    {
      id: 'test-ar',
      name: 'Test AR',
      markets: ['UAE'],
      enabled: true,
      contactTokens: [{ token: 'اتصل', weight: 50 }],
      aboutTokens: [],
      negativeTokens: [],
    },
  ],
};
const arHtml = `<nav><a href="/x">اتصل بنا</a></nav>`;
const arFound = discoverExtraPageUrls(arHtml, 'https://ar.test', {
  extraPaths: [],
  contactKeywords: [],
  aboutKeywords: [],
  locales: arabicLocales,
  maxExtra: 2,
});
assert(arFound.some((u) => u.includes('/x')), 'user locale pack matches Arabic link');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
