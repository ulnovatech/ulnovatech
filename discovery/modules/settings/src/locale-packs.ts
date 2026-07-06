import { randomUUID } from 'crypto';
import { isStableLocalePackId } from './builtin-lexicon';
import type { LocalePack, LocalePackImport, LocalePackToken, LocaleSettings } from './locale-types';

export const DEFAULT_TOKEN_WEIGHT = 32;

export function tokensToLexicon(tokens: LocalePackToken[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of tokens) {
    const key = t.token.trim().toLowerCase();
    if (!key) continue;
    map[key] = t.weight ?? DEFAULT_TOKEN_WEIGHT;
  }
  return map;
}

export function mergeLexicons(...maps: Record<string, number>[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const m of maps) {
    for (const [k, v] of Object.entries(m)) {
      out[k] = Math.max(out[k] ?? 0, v);
    }
  }
  return out;
}

export function enabledPacks(settings: LocaleSettings): LocalePack[] {
  return settings.packs.filter((p) => p.enabled);
}

export function buildLocaleLexicons(settings: LocaleSettings): {
  contact: Record<string, number>;
  about: Record<string, number>;
  negative: Record<string, number>;
} {
  const packs = enabledPacks(settings);
  return {
    contact: mergeLexicons(...packs.map((p) => tokensToLexicon(p.contactTokens))),
    about: mergeLexicons(...packs.map((p) => tokensToLexicon(p.aboutTokens))),
    negative: mergeLexicons(...packs.map((p) => tokensToLexicon(p.negativeTokens))),
  };
}

export function normalizeLocalePack(raw: LocalePackImport): LocalePack {
  return {
    id: raw.id?.trim() || randomUUID(),
    name: raw.name?.trim() || 'Unnamed pack',
    languageCode: raw.languageCode?.trim() || undefined,
    markets: (raw.markets ?? []).map((m) => m.trim()).filter(Boolean),
    contactTokens: (raw.contactTokens ?? []).filter((t) => t.token?.trim()),
    aboutTokens: (raw.aboutTokens ?? []).filter((t) => t.token?.trim()),
    negativeTokens: (raw.negativeTokens ?? []).filter((t) => t.token?.trim()),
    enabled: raw.enabled !== false,
    notes: raw.notes?.trim() || undefined,
    source: raw.source?.trim() || undefined,
  };
}

function parseTokenLine(line: string, section: 'contact' | 'about' | 'negative'): LocalePackToken | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const [token, weightRaw] = trimmed.split(':').map((s) => s.trim());
  if (!token) return null;
  const weight = weightRaw ? parseInt(weightRaw, 10) : undefined;
  return { token, weight: Number.isFinite(weight) ? weight : undefined };
}

/** Parse simple text doc: sections # contact / # about / # negative, lines as token or token:weight */
export function parseLocalePackDocument(text: string, meta?: Partial<LocalePackImport>): LocalePack {
  let section: 'contact' | 'about' | 'negative' = 'contact';
  const contactTokens: LocalePackToken[] = [];
  const aboutTokens: LocalePackToken[] = [];
  const negativeTokens: LocalePackToken[] = [];

  for (const line of text.split(/\r?\n/)) {
    const lower = line.trim().toLowerCase();
    if (lower === '# contact' || lower === '[contact]') {
      section = 'contact';
      continue;
    }
    if (lower === '# about' || lower === '[about]') {
      section = 'about';
      continue;
    }
    if (lower === '# negative' || lower === '[negative]') {
      section = 'negative';
      continue;
    }
    if (lower.startsWith('# name:')) {
      meta = { ...meta, name: line.split(':').slice(1).join(':').trim() };
      continue;
    }
    if (lower.startsWith('# language:')) {
      meta = { ...meta, languageCode: line.split(':').slice(1).join(':').trim() };
      continue;
    }
    if (lower.startsWith('# markets:')) {
      meta = {
        ...meta,
        markets: line
          .split(':')
          .slice(1)
          .join(':')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      continue;
    }

    const tok = parseTokenLine(line, section);
    if (!tok) continue;
    if (section === 'contact') contactTokens.push(tok);
    else if (section === 'about') aboutTokens.push(tok);
    else negativeTokens.push(tok);
  }

  return normalizeLocalePack({
    name: meta?.name ?? 'Imported pack',
    languageCode: meta?.languageCode,
    markets: meta?.markets ?? [],
    contactTokens,
    aboutTokens,
    negativeTokens,
    enabled: true,
    source: 'import',
    ...meta,
  });
}

export function parseLocalePackJson(json: unknown): LocalePack[] {
  if (Array.isArray(json)) {
    return json.map((item) => normalizeLocalePack(item as LocalePackImport));
  }
  if (json && typeof json === 'object' && 'packs' in json && Array.isArray((json as { packs: unknown }).packs)) {
    return (json as { packs: LocalePackImport[] }).packs.map(normalizeLocalePack);
  }
  return [normalizeLocalePack(json as LocalePackImport)];
}

export function localePackToDocument(pack: LocalePack): string {
  const lines = [
    `# name: ${pack.name}`,
    pack.languageCode ? `# language: ${pack.languageCode}` : '',
    pack.markets.length ? `# markets: ${pack.markets.join(', ')}` : '',
    '# contact',
    ...pack.contactTokens.map((t) => (t.weight != null ? `${t.token}:${t.weight}` : t.token)),
    '# about',
    ...pack.aboutTokens.map((t) => (t.weight != null ? `${t.token}:${t.weight}` : t.token)),
  ];
  if (pack.negativeTokens.length) {
    lines.push('# negative', ...pack.negativeTokens.map((t) => (t.weight != null ? `${t.token}:${t.weight}` : t.token)));
  }
  return lines.filter(Boolean).join('\n');
}

export function localePackToJson(pack: LocalePack | LocalePack[]): string {
  return JSON.stringify(pack, null, 2);
}

export const LOCALE_TEMPLATE_DOC = `# name: My Market Pack
# language: ar
# markets: UAE, Saudi Arabia

# contact
اتصل:40
contact:35
support:30

# about
about:36
story:28
`;

/** Merge imported packs; stable ids (builtin, starters) upsert instead of duplicating */
export function mergeImportedLocalePacks(existing: LocalePack[], imported: LocalePack[]): LocalePack[] {
  const next = [...existing];
  for (const raw of imported) {
    const keepId = isStableLocalePackId(raw.id) ? raw.id : undefined;
    const pack = normalizeLocalePack({
      ...raw,
      id: keepId,
      enabled: raw.enabled !== false,
    });
    if (keepId) {
      const idx = next.findIndex((e) => e.id === keepId);
      if (idx >= 0) next[idx] = pack;
      else next.push(pack);
    } else {
      next.push(normalizeLocalePack({ ...raw, id: undefined, enabled: raw.enabled !== false }));
    }
  }
  return next;
}

export const STARTER_LOCALE_PACKS: LocalePack[] = [
  normalizeLocalePack({
    id: 'starter-ar-gulf',
    name: 'Arabic — Gulf (starter)',
    languageCode: 'ar',
    markets: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    enabled: false,
    source: 'builtin-starter',
    contactTokens: [
      { token: 'اتصل', weight: 40 },
      { token: 'تواصل', weight: 38 },
      { token: 'اتصل-بنا', weight: 40 },
      { token: 'contact', weight: 35 },
      { token: 'support', weight: 30 },
    ],
    aboutTokens: [
      { token: 'من-نحن', weight: 36 },
      { token: 'about', weight: 34 },
      { token: 'story', weight: 28 },
    ],
    negativeTokens: [],
  }),
  normalizeLocalePack({
    id: 'starter-hi-in',
    name: 'Hindi — India (starter)',
    languageCode: 'hi',
    markets: ['India'],
    enabled: false,
    source: 'builtin-starter',
    contactTokens: [
      { token: 'संपर्क', weight: 40 },
      { token: 'contact', weight: 35 },
      { token: 'सहायता', weight: 30 },
      { token: 'location', weight: 28 },
    ],
    aboutTokens: [
      { token: 'हमारे-बारे-में', weight: 36 },
      { token: 'about', weight: 34 },
      { token: 'team', weight: 28 },
    ],
    negativeTokens: [],
  }),
  normalizeLocalePack({
    id: 'starter-sw-east-africa',
    name: 'Swahili — East Africa (starter)',
    languageCode: 'sw',
    markets: ['Uganda', 'Kenya', 'Tanzania'],
    enabled: false,
    source: 'builtin-starter',
    contactTokens: [
      { token: 'wasiliana', weight: 40 },
      { token: 'mawasiliano', weight: 38 },
      { token: 'contact', weight: 35 },
    ],
    aboutTokens: [
      { token: 'kuhusu', weight: 34 },
      { token: 'about', weight: 32 },
    ],
    negativeTokens: [],
  }),
];
