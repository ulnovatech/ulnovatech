import type { LocaleSettings } from '@agency/settings';
import { buildEffectiveLexicons } from './effective-lexicon';
import { extractLinksWithContext } from './link-extract';
import {
  ABOUT_PATH_STEMS,
  combinedIntentScore,
  CONTACT_PATH_STEMS,
  generateFallbackPaths,
  MIN_INTENT_SCORE,
  scoreLinkIntent,
} from './link-intent';

export interface LinkDiscoveryOptions {
  extraPaths: string[];
  contactKeywords: string[];
  aboutKeywords: string[];
  locales: LocaleSettings;
  maxExtra: number;
}

interface ScoredUrl {
  url: string;
  score: number;
}

function isSkippableHref(href: string): boolean {
  const lower = href.trim().toLowerCase();
  return (
    !lower ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('javascript:') ||
    lower === '#' ||
    lower.startsWith('#')
  );
}

function resolveInternalUrl(href: string, base: URL): string | null {
  if (isSkippableHref(href)) return null;
  try {
    const resolved = new URL(href, base);
    if (resolved.hostname !== base.hostname) return null;
    const path = `${resolved.pathname}${resolved.search}`;
    if (path === '/' || path === '') return null;
    return resolved.href;
  } catch {
    return null;
  }
}

function pathFromResolved(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function addProbe(
  href: string,
  base: URL,
  scored: ScoredUrl[],
  seen: Set<string>,
  score: number,
) {
  const resolved = resolveInternalUrl(href, base);
  if (!resolved || seen.has(resolved)) return;
  seen.add(resolved);
  scored.push({ url: resolved, score });
}

export function discoverExtraPageUrls(
  html: string,
  baseUrl: string,
  options: LinkDiscoveryOptions,
): string[] {
  const base = new URL(baseUrl);
  const lexicons = buildEffectiveLexicons(
    options.locales,
    options.contactKeywords,
    options.aboutKeywords,
  );
  const scored: ScoredUrl[] = [];
  const seen = new Set<string>();

  for (const link of extractLinksWithContext(html)) {
    const resolved = resolveInternalUrl(link.href, base);
    if (!resolved) continue;

    const intent = scoreLinkIntent(link, pathFromResolved(resolved), lexicons);
    const score = combinedIntentScore(intent);
    if (score < MIN_INTENT_SCORE) continue;
    if (seen.has(resolved)) continue;

    seen.add(resolved);
    scored.push({ url: resolved, score });
  }

  scored.sort((a, b) => b.score - a.score);

  if (scored.length < options.maxExtra) {
    const probeScore = MIN_INTENT_SCORE - 1;
    for (const path of options.extraPaths) {
      addProbe(path, base, scored, seen, probeScore);
    }
    for (const path of [
      ...generateFallbackPaths(CONTACT_PATH_STEMS),
      ...generateFallbackPaths(ABOUT_PATH_STEMS),
    ]) {
      if (scored.length >= options.maxExtra) break;
      addProbe(path, base, scored, seen, probeScore);
    }
    scored.sort((a, b) => b.score - a.score);
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.url)
    .slice(0, options.maxExtra);
}
