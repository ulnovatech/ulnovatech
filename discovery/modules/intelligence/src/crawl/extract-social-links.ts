import { detectSocialPlatform } from '../bi/social-links';

export const LINK_IN_BIO_HOSTS = [
  'linktr.ee',
  'linktree.com',
  'bio.link',
  'beacons.ai',
  'beacons.page',
  'campsite.bio',
  'taplink.cc',
  'tap.bio',
  'hoo.be',
  'stan.store',
  'allmylinks.com',
  'lnk.bio',
  'withkoji.com',
  'carrd.co',
  'msha.ke',
] as const;

const SOCIAL_HOST_PATTERNS: Array<{ platform: ReturnType<typeof detectSocialPlatform>; test: RegExp }> = [
  { platform: 'facebook', test: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i },
  { platform: 'instagram', test: /(^|\.)instagram\.com$/i },
  { platform: 'tiktok', test: /(^|\.)tiktok\.com$/i },
  { platform: 'linkedin', test: /(^|\.)linkedin\.com$/i },
  { platform: 'youtube', test: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { platform: 'twitter', test: /(^|\.)twitter\.com$|(^|\.)x\.com$/i },
  { platform: 'whatsapp', test: /(^|\.)wa\.me$|(^|\.)whatsapp\.com$/i },
];

export type ExtractedSocialUrls = {
  socialUrls: string[];
  linkInBioUrls: string[];
  byPlatform: Partial<Record<ReturnType<typeof detectSocialPlatform>, string>>;
};

function normalizeUrl(url: string, base?: string): string | null {
  try {
    const resolved = base ? new URL(url, base) : new URL(url);
    if (!/^https?:$/i.test(resolved.protocol)) return null;
    resolved.hash = '';
    return resolved.href.replace(/\/$/, '');
  } catch {
    return null;
  }
}

export function isLinkInBioHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return LINK_IN_BIO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function isLinkInBioUrl(url: string): boolean {
  try {
    return isLinkInBioHost(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isSocialHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return SOCIAL_HOST_PATTERNS.some((p) => p.test.test(host));
}

function isSkippableOutbound(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (isLinkInBioHost(host)) return true;
  if (host.includes('google.com') && host.includes('maps')) return false;
  if (host.includes('goo.gl')) return false;
  if (host.endsWith('apple.com') && host.includes('apps')) return true;
  return false;
}

export function extractHrefUrls(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const urls = new Set<string>();

  for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)) {
    const normalized = normalizeUrl(match[1], base.href);
    if (normalized) urls.add(normalized);
  }

  for (const match of html.matchAll(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/gi)) {
    const normalized = normalizeUrl(match[1]);
    if (normalized) urls.add(normalized);
  }

  return [...urls];
}

export function classifyUrl(url: string): 'social' | 'link_in_bio' | 'website' | 'skip' {
  try {
    const host = new URL(url).hostname;
    if (isLinkInBioHost(host)) return 'link_in_bio';
    if (isSocialHost(host)) return 'social';
    if (isSkippableOutbound(host)) return 'skip';
    return 'website';
  } catch {
    return 'skip';
  }
}

export function extractSocialUrlsFromHtml(html: string, baseUrl: string): ExtractedSocialUrls {
  const socialUrls: string[] = [];
  const linkInBioUrls: string[] = [];
  const byPlatform: ExtractedSocialUrls['byPlatform'] = {};
  const seenSocial = new Set<string>();
  const seenLib = new Set<string>();

  for (const url of extractHrefUrls(html, baseUrl)) {
    const kind = classifyUrl(url);
    if (kind === 'link_in_bio') {
      if (!seenLib.has(url)) {
        seenLib.add(url);
        linkInBioUrls.push(url);
      }
      continue;
    }
    if (kind !== 'social') continue;

    const platform = detectSocialPlatform(url);
    if (!seenSocial.has(url)) {
      seenSocial.add(url);
      socialUrls.push(url);
    }
    if (!byPlatform[platform]) {
      byPlatform[platform] = url;
    }
  }

  return { socialUrls, linkInBioUrls, byPlatform };
}

export function mergeExtractedSocial(items: ExtractedSocialUrls[]): ExtractedSocialUrls {
  const socialUrls: string[] = [];
  const linkInBioUrls: string[] = [];
  const byPlatform: ExtractedSocialUrls['byPlatform'] = {};
  const seenSocial = new Set<string>();
  const seenLib = new Set<string>();

  for (const item of items) {
    for (const url of item.socialUrls) {
      if (seenSocial.has(url)) continue;
      seenSocial.add(url);
      socialUrls.push(url);
      const platform = detectSocialPlatform(url);
      if (!byPlatform[platform]) byPlatform[platform] = url;
    }
    for (const url of item.linkInBioUrls) {
      if (seenLib.has(url)) continue;
      seenLib.add(url);
      linkInBioUrls.push(url);
    }
  }

  return { socialUrls, linkInBioUrls, byPlatform };
}
