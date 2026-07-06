import { createHash } from 'crypto';
import { platformSettings } from '@agency/settings';
import type { DiscoveredBusiness, DiscoverySearchParams } from './types';
import {
  classifySearchResult,
  DIRECTORY_LISTICLE_TITLE_RE,
  isExtractableDirectoryListing,
  isKeepableSearchResult,
  type SocialPlatform,
} from './search-result-classifier';

export interface SearchResultItem {
  title: string;
  link: string;
  snippet?: string;
}

function hashLink(link: string): string {
  return createHash('sha256').update(link).digest('hex').slice(0, 24);
}

function extractDomain(link: string): string | undefined {
  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export function cleanSearchResultTitle(title: string): string {
  return title
    .replace(/\s*[-|–—]\s*(Facebook|Instagram|TikTok|LinkedIn|YouTube|Google Maps|Yelp|Tripadvisor).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .replace(/\s+on\s+(Facebook|Instagram|TikTok|LinkedIn|YouTube)\s*$/i, '')
    .trim();
}

const DIRECTORY_SUFFIX_RE =
  /\s*[-|–—]\s*(yellow pages|yelp|tripadvisor|brabys|hotfrog|cylex|infoisinfo|business\s*list|google maps|restaurant guru|jiji|snupit|african advice).*$/i;

const URL_SLUG_SEGMENT_RE = /[a-z0-9]+(?:-[a-z0-9]+)+/i;

const SNIPPET_URL_RE = /https?:\/\/[^\s<>"')]+/gi;

const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/;

function titleCaseWords(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function slugToBusinessName(slug: string, cityHint?: string): string {
  let parts = slug.split('-').filter(Boolean);
  if (parts.length === 0) return '';

  const city = cityHint?.trim().toLowerCase().replace(/\s+/g, '-');
  if (city && parts[parts.length - 1] === city) {
    parts = parts.slice(0, -1);
  }
  if (parts.length === 0) return '';

  return titleCaseWords(parts.join(' '));
}

export function extractBusinessNameFromDirectoryTitle(
  title: string,
  directoryHost?: string,
): string {
  let name = cleanSearchResultTitle(title);
  name = name.replace(DIRECTORY_SUFFIX_RE, '').trim();

  if (directoryHost) {
    const hostStem = directoryHost.split('.')[0]?.replace(/-/g, ' ');
    if (hostStem && name.toLowerCase().endsWith(hostStem)) {
      name = name.slice(0, -hostStem.length).replace(/\s*[-|–—]\s*$/, '').trim();
    }
  }

  const citySplit = name.match(/^(.+?)\s*[-–—]\s*([A-Za-z][A-Za-z\s.'']{2,40})$/);
  if (citySplit?.[1] && citySplit[2] && !DIRECTORY_LISTICLE_TITLE_RE.test(citySplit[1])) {
    name = citySplit[1].trim();
  }

  return name.trim();
}

export function extractNameFromDirectoryUrl(link: string, cityHint?: string): string | undefined {
  try {
    const url = new URL(link);
    const segments = url.pathname.split('/').filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i] ?? '';
      if (!URL_SLUG_SEGMENT_RE.test(seg)) continue;
      if (['search', 'results', 'category', 'categories', 'listings'].includes(seg)) continue;
      const name = slugToBusinessName(seg, cityHint);
      if (name.length >= 2) return name;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function extractExternalWebsiteFromSnippet(
  snippet: string | undefined,
  directoryHost?: string,
): string | undefined {
  if (!snippet?.trim()) return undefined;

  const directoryRoot = directoryHost?.toLowerCase().replace(/^www\./, '');
  const blockedHosts = ['facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'youtube.com', 'tiktok.com'];

  for (const match of snippet.match(SNIPPET_URL_RE) ?? []) {
    try {
      const url = new URL(match.replace(/[.,;]+$/, ''));
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (directoryRoot && host.includes(directoryRoot.split('.')[0] ?? '')) continue;
      if (blockedHosts.some((b) => host.includes(b))) continue;
      if (host.includes('yellowpages') || host.includes('yelp.') || host.includes('tripadvisor')) continue;
      return url.toString();
    } catch {
      continue;
    }
  }
  return undefined;
}

export function extractPhoneFromSnippet(snippet: string | undefined): string | undefined {
  if (!snippet?.trim()) return undefined;
  const match = snippet.match(PHONE_RE);
  if (!match) return undefined;
  const digits = match[0].replace(/\D/g, '');
  if (digits.length < 9) return undefined;
  return match[0].trim();
}

export function extractDirectoryCandidate(
  item: SearchResultItem,
  params: DiscoverySearchParams,
  query: string,
): DiscoveredBusiness | null {
  if (!item.title?.trim() || !item.link?.trim()) return null;
  if (!isExtractableDirectoryListing(item.link, item.title, item.snippet)) return null;

  const link = item.link.trim();
  const directoryHost = extractDomain(link);
  const cityHint = platformSettings.isAllCities(params.city) ? undefined : params.city;

  let name = extractBusinessNameFromDirectoryTitle(item.title, directoryHost);
  if (name.length < 2) {
    name = extractNameFromDirectoryUrl(link, cityHint) ?? '';
  }
  if (name.length < 2 || DIRECTORY_LISTICLE_TITLE_RE.test(name)) return null;

  const website = extractExternalWebsiteFromSnippet(item.snippet, directoryHost);
  const phone = extractPhoneFromSnippet(item.snippet);

  return {
    name,
    industry: params.industry,
    country: params.country,
    city: cityHint,
    source: 'public_search',
    sourceUrl: link,
    externalId: `search:${hashLink(link)}`,
    website,
    phone,
    metadata: {
      searchQuery: query,
      snippet: item.snippet,
      domain: directoryHost,
      resultKind: 'directory',
      extractedFromDirectory: true,
      directoryHost,
    },
  };
}

function applySocialUrl(
  business: DiscoveredBusiness,
  platform: SocialPlatform,
  link: string,
): void {
  switch (platform) {
    case 'facebook':
      business.facebookUrl = link;
      business.website = undefined;
      break;
    case 'instagram':
      business.instagramUrl = link;
      break;
    case 'tiktok':
      business.metadata = { ...business.metadata, tiktokUrl: link };
      break;
    case 'linkedin':
      business.metadata = { ...business.metadata, linkedinUrl: link };
      break;
    case 'youtube':
      business.metadata = { ...business.metadata, youtubeUrl: link };
      break;
    case 'twitter':
      business.metadata = { ...business.metadata, twitterUrl: link };
      break;
  }
}

export function parseSearchResultItem(
  item: SearchResultItem,
  params: DiscoverySearchParams,
  query: string,
): DiscoveredBusiness | null {
  if (!item.title?.trim() || !item.link?.trim()) return null;

  const classification = classifySearchResult(item.link, item.title, item.snippet);

  if (classification.kind === 'directory') {
    return extractDirectoryCandidate(item, params, query);
  }

  if (!isKeepableSearchResult(classification)) return null;

  const link = item.link.trim();
  const lower = link.toLowerCase();
  const name = cleanSearchResultTitle(item.title);
  if (name.length < 2) return null;

  const business: DiscoveredBusiness = {
    name,
    industry: params.industry,
    country: params.country,
    city: platformSettings.isAllCities(params.city) ? undefined : params.city,
    source: 'public_search',
    sourceUrl: link,
    externalId: `search:${hashLink(link)}`,
    metadata: {
      searchQuery: query,
      snippet: item.snippet,
      domain: extractDomain(link),
      resultKind: classification.kind,
      primaryPlatform: classification.platform,
    },
  };

  if (classification.kind === 'social_profile' && classification.platform) {
    applySocialUrl(business, classification.platform, link);
    return business;
  }

  if (lower.includes('google.com/maps') || lower.includes('maps.google')) {
    business.googleMapsUrl = link;
  } else if (!lower.includes('facebook.com') && !lower.includes('instagram.com')) {
    business.website = link;
  }

  return business;
}
