import { platformSettings } from '@agency/settings';
import {
  extractHrefUrls,
  extractSocialUrlsFromHtml,
  isLinkInBioUrl,
  type ExtractedSocialUrls,
} from '../crawl/extract-social-links';
import { detectSocialPlatform, mergeSocialLinks, socialLinkFromUrl } from './social-links';
import type { BiLinkInBioPage, BiSocialLink } from './types';

export type LinkInBioResolveResult = {
  page: BiLinkInBioPage;
  discoveredLinks: BiSocialLink[];
  discoveredWebsite?: string | null;
};

const MAX_LINK_IN_BIO_FETCHES = 2;

async function fetchHtml(url: string): Promise<{ ok: true; html: string } | { ok: false; status: string }> {
  await platformSettings.ensureLoaded();
  const crawl = platformSettings.getCrawlSettings();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), crawl.fetchTimeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': crawl.userAgent },
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: 'blocked' };
    }
    if (!res.ok) {
      return { ok: false, status: 'unreachable' };
    }

    return { ok: true, html: await res.text() };
  } catch {
    clearTimeout(timeout);
    return { ok: false, status: 'unreachable' };
  }
}

export function parseLinkInBioHtml(html: string, pageUrl: string): {
  socialUrls: string[];
  websiteUrl?: string | null;
} {
  const extracted = extractSocialUrlsFromHtml(html, pageUrl);
  let websiteUrl: string | null = null;

  for (const href of extractHrefUrls(html, pageUrl)) {
    if (isLinkInBioUrl(href)) continue;
    const platform = detectSocialPlatform(href);
    if (platform !== 'other') continue;
    try {
      const parsed = new URL(href);
      if (!/^https?:$/i.test(parsed.protocol)) continue;
      websiteUrl = href;
      break;
    } catch {
      continue;
    }
  }

  return {
    socialUrls: extracted.socialUrls,
    websiteUrl,
  };
}

export async function resolveLinkInBioPage(url: string): Promise<LinkInBioResolveResult> {
  const normalized = url.trim();
  const fetched = await fetchHtml(normalized);

  if (!fetched.ok) {
    return {
      page: {
        url: normalized,
        resolvedAt: new Date().toISOString(),
        outboundLinks: [],
        fetchStatus: fetched.status as BiLinkInBioPage['fetchStatus'],
      },
      discoveredLinks: [],
    };
  }

  const parsed = parseLinkInBioHtml(fetched.html, normalized);
  const outboundLinks = mergeSocialLinks(
    parsed.socialUrls
      .map((u) => socialLinkFromUrl(u, 'link_in_bio'))
      .filter((l): l is BiSocialLink => l != null),
  );

  return {
    page: {
      url: normalized,
      resolvedAt: new Date().toISOString(),
      outboundLinks,
      resolvedWebsite: parsed.websiteUrl ?? null,
      fetchStatus: 'ok',
    },
    discoveredLinks: outboundLinks,
    discoveredWebsite: parsed.websiteUrl ?? null,
  };
}

export async function resolveLinkInBioUrls(
  urls: string[],
  maxFetches = MAX_LINK_IN_BIO_FETCHES,
): Promise<{
  pages: BiLinkInBioPage[];
  discoveredLinks: BiSocialLink[];
  discoveredWebsites: string[];
}> {
  const unique = [...new Set(urls.filter(isLinkInBioUrl))].slice(0, maxFetches);
  const pages: BiLinkInBioPage[] = [];
  const discoveredLinks: BiSocialLink[] = [];
  const discoveredWebsites: string[] = [];

  for (const url of unique) {
    const result = await resolveLinkInBioPage(url);
    pages.push(result.page);
    discoveredLinks.push(...result.discoveredLinks);
    if (result.discoveredWebsite) discoveredWebsites.push(result.discoveredWebsite);
  }

  return {
    pages,
    discoveredLinks: mergeSocialLinks(discoveredLinks),
    discoveredWebsites,
  };
}

export function collectLinkInBioCandidates(input: {
  website?: string | null;
  crawlLinkInBioUrls?: string[];
  socialUrls?: string[];
}): string[] {
  const candidates = new Set<string>();
  for (const url of input.crawlLinkInBioUrls ?? []) {
    if (isLinkInBioUrl(url)) candidates.add(url);
  }
  for (const url of input.socialUrls ?? []) {
    if (isLinkInBioUrl(url)) candidates.add(url);
  }
  if (input.website && isLinkInBioUrl(input.website)) {
    candidates.add(input.website);
  }
  return [...candidates];
}

export type FootprintEnrichmentInput = {
  socialLinks: BiSocialLink[];
  website?: string | null;
  crawlSocialUrls?: string[];
  crawlLinkInBioUrls?: string[];
};

export type FootprintEnrichmentResult = {
  socialLinks: BiSocialLink[];
  linkInBioPages: BiLinkInBioPage[];
  resolvedWebsite?: string | null;
};

export async function enrichDigitalFootprint(
  input: FootprintEnrichmentInput,
): Promise<FootprintEnrichmentResult> {
  const crawlLinks = mergeSocialLinks(
    (input.crawlSocialUrls ?? [])
      .map((url) => socialLinkFromUrl(url, 'crawl'))
      .filter((l): l is BiSocialLink => l != null),
  );

  let socialLinks = mergeSocialLinks([...input.socialLinks, ...crawlLinks]);

  const libCandidates = collectLinkInBioCandidates({
    website: input.website,
    crawlLinkInBioUrls: input.crawlLinkInBioUrls,
    socialUrls: input.crawlSocialUrls,
  });

  const { pages, discoveredLinks, discoveredWebsites } = await resolveLinkInBioUrls(libCandidates);
  socialLinks = mergeSocialLinks([...socialLinks, ...discoveredLinks]);

  return {
    socialLinks,
    linkInBioPages: pages,
    resolvedWebsite: discoveredWebsites[0] ?? null,
  };
}

export { mergeExtractedSocial, type ExtractedSocialUrls } from '../crawl/extract-social-links';
