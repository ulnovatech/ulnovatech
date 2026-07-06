import { buildBuiltinLocalePack } from '../builtin-lexicon';
import {
  buildLocaleLexicons,
  mergeImportedLocalePacks,
  normalizeLocalePack,
  parseLocalePackDocument,
  parseLocalePackJson,
  tokensToLexicon,
} from '../locale-packs';

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

const doc = `# name: Hindi Test
# language: hi
# markets: India
# contact
संपर्क:40
contact:35
# about
about:30
`;

const fromDoc = parseLocalePackDocument(doc);
assert(fromDoc.name === 'Hindi Test', 'parses doc name');
assert(fromDoc.contactTokens.some((t) => t.token === 'संपर्क'), 'parses unicode contact token');

const fromJson = parseLocalePackJson({
  name: 'JSON Pack',
  contactTokens: [{ token: 'kontakt', weight: 40 }],
  aboutTokens: [],
  negativeTokens: [],
  markets: ['Germany'],
  enabled: true,
});
assert(fromJson[0].name === 'JSON Pack', 'parses json pack');

const lex = buildLocaleLexicons({
  useBuiltinLexicon: false,
  packs: [fromDoc],
});
assert(lex.contact['संपर्क'] === 40, 'builds locale lexicon from pack');
assert(tokensToLexicon([{ token: 'test', weight: 10 }]).test === 10, 'tokensToLexicon');

const builtin = buildBuiltinLocalePack();
assert(builtin.id === 'builtin-multilingual', 'builtin pack has stable id');
assert(builtin.contactTokens.some((t) => t.token === 'kontakt'), 'builtin includes kontakt');
assert(builtin.contactTokens.length > 20, 'builtin has substantial contact tokens');

const merged = mergeImportedLocalePacks(
  [builtin],
  [
    normalizeLocalePack({
      ...builtin,
      name: 'Updated builtin',
      contactTokens: [{ token: 'new', weight: 50 }],
    }),
  ],
);
assert(merged.length === 1, 'stable id upserts instead of duplicating');
assert(merged[0].name === 'Updated builtin', 'builtin upsert updates pack');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
