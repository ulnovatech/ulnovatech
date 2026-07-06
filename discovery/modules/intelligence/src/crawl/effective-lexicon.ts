import {
  ABOUT_INTENT_LEXICON,
  CONTACT_INTENT_LEXICON,
  NEGATIVE_INTENT_LEXICON,
} from './intent-lexicon';
import {
  buildLocaleLexicons,
  mergeLexicons,
  tokensToLexicon,
  type LocaleSettings,
} from '@agency/settings';

export interface EffectiveLexicons {
  contact: Record<string, number>;
  about: Record<string, number>;
  negative: Record<string, number>;
}

export function buildEffectiveLexicons(
  locales: LocaleSettings,
  contactKeywords: string[],
  aboutKeywords: string[],
): EffectiveLexicons {
  const userLocales = buildLocaleLexicons(locales);
  const contactKw = tokensToLexicon(contactKeywords.map((k) => ({ token: k, weight: 30 })));
  const aboutKw = tokensToLexicon(aboutKeywords.map((k) => ({ token: k, weight: 30 })));

  return {
    contact: mergeLexicons(
      locales.useBuiltinLexicon ? CONTACT_INTENT_LEXICON : {},
      userLocales.contact,
      contactKw,
    ),
    about: mergeLexicons(
      locales.useBuiltinLexicon ? ABOUT_INTENT_LEXICON : {},
      userLocales.about,
      aboutKw,
    ),
    negative: mergeLexicons(
      locales.useBuiltinLexicon ? NEGATIVE_INTENT_LEXICON : {},
      userLocales.negative,
    ),
  };
}
