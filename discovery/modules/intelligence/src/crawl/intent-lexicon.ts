/**
 * Intent token lexicons — re-exported from @agency/settings (single source of truth).
 */
export {
  ABOUT_INTENT_LEXICON,
  ABOUT_PATH_STEMS,
  CONTACT_INTENT_LEXICON,
  CONTACT_PATH_STEMS,
  NEGATIVE_INTENT_LEXICON,
} from '@agency/settings';

export type IntentKind = 'contact' | 'about' | 'negative';
