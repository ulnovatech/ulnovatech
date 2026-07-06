import type { EffectiveLexicons } from './effective-lexicon';
import { ABOUT_PATH_STEMS, CONTACT_PATH_STEMS } from './intent-lexicon';
import type { ExtractedLink } from './link-extract';

export interface IntentScore {
  contact: number;
  about: number;
  negative: number;
}

export function normalizeForMatch(text: string): string {
  return text
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

/** Unicode-aware tokenization for multilingual locale packs */
export function tokenize(text: string): string[] {
  const expanded = new Set<string>();
  const lower = text.trim().toLowerCase();

  for (const part of lower.split(/[\s\-_/,|+]+/).filter((t) => t.length >= 1)) {
    expanded.add(part);
    if (part.includes('-')) {
      for (const sub of part.split('-')) {
        if (sub.length >= 1) expanded.add(sub);
      }
    }
  }

  const latin = normalizeForMatch(text).split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
  for (const t of latin) expanded.add(t);

  return [...expanded];
}

function scoreLexicon(tokens: string[], blob: string, lexicon: Record<string, number>): number {
  let score = 0;
  const lowerBlob = blob.toLowerCase();
  const originalBlob = blob;
  for (const [token, weight] of Object.entries(lexicon)) {
    const t = token.toLowerCase();
    if (tokens.includes(t) || lowerBlob.includes(t) || originalBlob.includes(token)) {
      score += weight;
    }
  }
  return score;
}

export function scoreLinkIntent(
  link: ExtractedLink,
  resolvedPath: string,
  lexicons: EffectiveLexicons,
): IntentScore {
  const parts = [link.text, link.ariaLabel ?? '', link.titleAttr ?? '', link.href, resolvedPath];
  const blob = parts.join(' ');
  const normalizedBlob = normalizeForMatch(blob);
  const tokens = tokenize(blob);

  let contact = scoreLexicon(tokens, normalizedBlob, lexicons.contact);
  let about = scoreLexicon(tokens, normalizedBlob, lexicons.about);
  let negative = scoreLexicon(tokens, normalizedBlob, lexicons.negative);

  if (link.inNav) {
    contact *= 1.35;
    about *= 1.25;
  }
  if (link.inFooter) {
    contact *= 1.3;
    about *= 1.2;
  }
  if (link.inHeader) {
    contact *= 1.15;
    about *= 1.1;
  }

  return {
    contact: Math.round(contact),
    about: Math.round(about),
    negative: Math.round(negative),
  };
}

export function combinedIntentScore(intent: IntentScore): number {
  const primary = Math.max(intent.contact, intent.about);
  return Math.max(0, primary - intent.negative * 0.6);
}

export const MIN_INTENT_SCORE = 18;

export function generateFallbackPaths(stems: string[]): string[] {
  return stems.map((s) => (s.startsWith('/') ? s : `/${s}`));
}

export { CONTACT_PATH_STEMS, ABOUT_PATH_STEMS };
