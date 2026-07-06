export interface LocalePackToken {
  token: string;
  weight?: number;
}

export interface LocalePack {
  id: string;
  name: string;
  languageCode?: string;
  markets: string[];
  contactTokens: LocalePackToken[];
  aboutTokens: LocalePackToken[];
  negativeTokens: LocalePackToken[];
  enabled: boolean;
  notes?: string;
  source?: string;
}

export interface LocaleSettings {
  useBuiltinLexicon: boolean;
  packs: LocalePack[];
}

export type LocalePackImport = Omit<LocalePack, 'id'> & { id?: string };
