import type { LocalePack, LocalePackToken } from './locale-types';
import { normalizeLocalePack } from './locale-packs';

/** token → weight — built-in multilingual crawl lexicon */
export const CONTACT_INTENT_LEXICON: Record<string, number> = {
  contact: 40,
  contacto: 40,
  contato: 40,
  contatti: 40,
  kontakt: 40,
  contacter: 38,
  wasiliana: 38,
  mawasiliano: 38,
  touch: 28,
  reach: 28,
  connect: 26,
  support: 30,
  help: 22,
  aide: 28,
  ayuda: 28,
  assist: 24,
  enquiry: 32,
  inquire: 32,
  inquiry: 32,
  quote: 24,
  location: 30,
  locations: 30,
  directions: 28,
  visit: 26,
  find: 18,
  book: 22,
  booking: 24,
  reserve: 22,
  reservation: 24,
  appointment: 24,
  call: 18,
  phone: 20,
  telephone: 20,
  email: 22,
  mail: 18,
  map: 16,
  office: 20,
  branch: 18,
  store: 14,
  ubicacion: 30,
  direccion: 28,
  localizacion: 28,
  nous: 12,
  escritorio: 18,
  sede: 20,
};

export const ABOUT_INTENT_LEXICON: Record<string, number> = {
  about: 36,
  sobre: 36,
  uber: 20,
  uns: 20,
  story: 28,
  historia: 28,
  team: 30,
  equipo: 28,
  staff: 26,
  company: 28,
  empresa: 28,
  mission: 24,
  vision: 22,
  values: 22,
  culture: 22,
  who: 18,
  founder: 22,
  history: 24,
  chi: 14,
  siamo: 28,
  quienes: 30,
  somos: 28,
  profile: 18,
  overview: 20,
};

export const NEGATIVE_INTENT_LEXICON: Record<string, number> = {
  privacy: 25,
  policy: 18,
  cookie: 20,
  terms: 22,
  legal: 18,
  login: 30,
  signin: 28,
  signup: 28,
  register: 24,
  cart: 30,
  checkout: 28,
  shop: 22,
  store: 8,
  product: 22,
  products: 22,
  menu: 20,
  blog: 18,
  news: 16,
  careers: 20,
  jobs: 20,
  gallery: 14,
  portfolio: 12,
  pricing: 18,
  download: 14,
  pdf: 12,
  wp: 6,
  admin: 30,
  feed: 16,
  rss: 16,
};

export const CONTACT_PATH_STEMS = [
  'contact',
  'contact-us',
  'contactus',
  'get-in-touch',
  'reach-us',
  'support',
  'locations',
  'find-us',
];

export const ABOUT_PATH_STEMS = ['about', 'about-us', 'aboutus', 'our-story', 'who-we-are', 'company', 'team'];

export const BUILTIN_LOCALE_PACK_ID = 'builtin-multilingual';

export type LocaleExternalResource = {
  name: string;
  url: string;
  description: string;
};

/** Curated links for building or validating locale packs */
export const LOCALE_EXTERNAL_RESOURCES: LocaleExternalResource[] = [
  {
    name: 'Unicode CLDR',
    url: 'https://cldr.unicode.org/',
    description: 'Official locale data — language names, territories, plural rules.',
  },
  {
    name: 'Wiktionary',
    url: 'https://www.wiktionary.org/',
    description: 'Multilingual dictionary — useful contact/about word lookups.',
  },
  {
    name: 'ISO 639 language codes',
    url: 'https://www.iso.org/iso-639-language-codes.html',
    description: 'Standard two- and three-letter language codes for pack metadata.',
  },
  {
    name: 'Mozilla Pontoon',
    url: 'https://pontoon.mozilla.org/',
    description: 'Real UI translation strings across many locales.',
  },
  {
    name: 'Google Translate glossary',
    url: 'https://cloud.google.com/translate/docs/advanced/glossary',
    description: 'Build consistent term lists when sourcing tokens from translators.',
  },
  {
    name: 'Omniglot',
    url: 'https://www.omniglot.com/writing/index.htm',
    description: 'Writing systems reference — helpful for non-Latin script markets.',
  },
];

function lexiconToTokens(lexicon: Record<string, number>): LocalePackToken[] {
  return Object.entries(lexicon)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([token, weight]) => ({ token, weight }));
}

export function buildBuiltinLocalePack(): LocalePack {
  return normalizeLocalePack({
    id: BUILTIN_LOCALE_PACK_ID,
    name: 'Built-in multilingual lexicon',
    languageCode: 'multi',
    markets: ['Global'],
    enabled: false,
    source: 'builtin',
    notes:
      'Platform default crawl lexicon (EN/FR/DE/ES/PT/IT/SW…). Edit and re-import to customize, or enable as a pack and turn off the global built-in toggle.',
    contactTokens: lexiconToTokens(CONTACT_INTENT_LEXICON),
    aboutTokens: lexiconToTokens(ABOUT_INTENT_LEXICON),
    negativeTokens: lexiconToTokens(NEGATIVE_INTENT_LEXICON),
  });
}

export function isStableLocalePackId(id: string | undefined): boolean {
  return !!id && (id === BUILTIN_LOCALE_PACK_ID || id.startsWith('starter-'));
}
