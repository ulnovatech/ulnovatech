export type SearchResultKind =
  | 'business_page'
  | 'social_profile'
  | 'directory'
  | 'article'
  | 'blocked';

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter';

export type SearchResultClassification = {
  kind: SearchResultKind;
  platform?: SocialPlatform;
};

const BLOCKED_HOST_FRAGMENTS = [
  'wikipedia.org',
  'amazon.',
  'pinterest.',
  'reddit.com',
  'quora.com',
];

/** Global aggregators — search/listicle pages dropped; single listing pages extracted. */
const GLOBAL_DIRECTORY_HOST_FRAGMENTS = [
  'yelp.com',
  'yellowpages.',
  'yp.com',
  'bbb.org',
  'hotfrog.',
  'brownbook.net',
  'manta.com',
  'chamberofcommerce.com',
  'findglocal.com',
  'yalwa.',
  'tupalo.com',
  'cylex-usa.com',
  'local.com',
  'superpages.com',
  'merchantcircle.com',
  'showmelocal.com',
  'citysearch.com',
  'tripadvisor.com/search',
  'tripadvisor.com/attractions',
  'tripadvisor.com/tourism',
  'foursquare.com/explore',
  'foursquare.com/places',
];

/** Africa / regional listing sites — single-business pages are extractable. */
export const LOCAL_DIRECTORY_HOST_FRAGMENTS = [
  'yellowpages.co.ug',
  'yellowpages.ug',
  'yellowpages.co.ke',
  'yellowpages.co.za',
  'yellowpages.co.tz',
  'yellowpages.co.ng',
  'ugandayellowpages.',
  'kenyayellowpages.',
  'nigeriayellowpages.',
  'businesslist.co.za',
  'brabys.com',
  'hotfrog.co.ug',
  'hotfrog.co.za',
  'hotfrog.co.ke',
  'findeuganda.com',
  'infoisinfo.co.za',
  'infoisinfo.net',
  'infoisinfo-africa.com',
  'cylex.co.za',
  'localbusiness.co.za',
  'snupit.co.za',
  'africanadvice.com',
  'guideuganda.com',
  'tupalo.co.za',
  'jiji.ug',
  'jiji.co.ke',
  'pigia.me',
  'bizcommunity.com',
  'restaurantguru.com',
];

const DIRECTORY_HOST_FRAGMENTS = [
  ...GLOBAL_DIRECTORY_HOST_FRAGMENTS,
  ...LOCAL_DIRECTORY_HOST_FRAGMENTS,
];

const DIRECTORY_PATH_FRAGMENTS = [
  '/top-10-',
  '/top-10/',
  '/best-',
  '/list-of-',
  '/directory/',
  '/listings/',
  '/category/',
];

const ARTICLE_PATH_FRAGMENTS = [
  '/blog/',
  '/news/',
  '/article/',
  '/articles/',
  '/press/',
  '/magazine/',
];

const ARTICLE_HOST_FRAGMENTS = ['medium.com', 'forbes.com', 'entrepreneur.com', 'inc.com'];

export const DIRECTORY_LISTICLE_TITLE_RE =
  /\b(top\s*\d+|best\s+\d+|list\s+of|the\s+\d+\s+best)\b/i;

const GENERIC_DIRECTORY_TITLE_RE =
  /^(restaurants?|salons?|spas?|businesses?|companies|shops?|services?)\s+(in|near)\b/i;

const SINGLE_BUSINESS_PATH_SEGMENTS = new Set([
  'biz',
  'business',
  'businesses',
  'company',
  'companies',
  'place',
  'places',
  'listing',
  'listings',
  'profile',
  'detail',
  'restaurant',
  'restaurants',
  'spa',
  'salon',
  'firm',
  'store',
  'shop',
  'vendor',
  'venue',
]);

function normalizeUrl(link: string): URL | null {
  try {
    return new URL(link.trim());
  } catch {
    return null;
  }
}

export function isLocalDirectoryHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return LOCAL_DIRECTORY_HOST_FRAGMENTS.some((f) => host.includes(f));
}

export function isKnownDirectoryHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return DIRECTORY_HOST_FRAGMENTS.some((f) => host.includes(f.replace(/\/.*$/, '')));
}

export function isDirectoryListicleOrSearch(
  link: string,
  title: string,
  snippet?: string,
): boolean {
  const url = normalizeUrl(link);
  if (!url) return true;

  const path = url.pathname.toLowerCase();
  const haystack = `${title} ${snippet ?? ''}`.toLowerCase();

  if (DIRECTORY_LISTICLE_TITLE_RE.test(title)) return true;
  if (GENERIC_DIRECTORY_TITLE_RE.test(title.trim())) return true;
  if (/\bthe\s+\d+\s+best\b/i.test(title)) return true;

  if (path === '/search' || path.endsWith('/search') || path.includes('/search?')) return true;
  if (
    ['/results', '/find-', '/attractions', '/tourism', '/category/', '/categories/'].some((f) =>
      path.includes(f),
    )
  ) {
    return true;
  }
  if (path.includes('/listings') && !isSingleBusinessDirectoryPath(path)) return true;

  if (url.searchParams.has('find_desc') || url.searchParams.has('find_loc')) return true;
  if (url.searchParams.has('q') && path.includes('search')) return true;

  if (DIRECTORY_PATH_FRAGMENTS.some((f) => path.includes(f)) && !isSingleBusinessDirectoryPath(path)) {
    return true;
  }

  if (/\btop\s+\d+\b/.test(haystack) && (path.includes('best') || path.includes('top'))) {
    return true;
  }

  return false;
}

export function isSingleBusinessDirectoryPath(pathname: string): boolean {
  const path = pathname.toLowerCase();
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 2) return false;

  if (segments.some((s) => SINGLE_BUSINESS_PATH_SEGMENTS.has(s))) return true;

  const last = segments[segments.length - 1] ?? '';
  if (
    last.length >= 4 &&
    last.includes('-') &&
    !last.includes('search') &&
    !['restaurants', 'salons', 'spas', 'businesses'].includes(last)
  ) {
    return true;
  }

  if (path.includes('/restaurant_review-') || path.includes('/restaurant-review')) return true;

  return false;
}

export function isExtractableDirectoryListing(
  link: string,
  title: string,
  snippet?: string,
): boolean {
  if (isDirectoryListicleOrSearch(link, title, snippet)) return false;

  const url = normalizeUrl(link);
  if (!url) return false;

  const host = url.hostname.toLowerCase();
  if (!isKnownDirectoryHost(host) && !isLocalDirectoryHost(host)) return false;

  return isSingleBusinessDirectoryPath(url.pathname) || isLocalDirectoryHost(host);
}

function detectSocialPlatform(hostname: string, pathname: string): SocialPlatform | undefined {
  const host = hostname.toLowerCase();
  const path = pathname.toLowerCase();

  if (host.includes('facebook.com')) {
    if (path.includes('/groups/') || path.includes('/events/') || path.includes('/watch/')) return undefined;
    return 'facebook';
  }
  if (host.includes('instagram.com')) {
    if (path.includes('/p/') || path.includes('/reel/') || path.includes('/explore/')) return undefined;
    return 'instagram';
  }
  if (host.includes('tiktok.com')) {
    if (path.includes('/@')) return 'tiktok';
    return undefined;
  }
  if (host.includes('linkedin.com')) {
    if (path.includes('/company/')) return 'linkedin';
    return undefined;
  }
  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    if (path.includes('/channel/') || path.includes('/c/') || path.includes('/@')) return 'youtube';
    return undefined;
  }
  if (host.includes('twitter.com') || host.includes('x.com')) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length === 1 && !['home', 'search', 'explore', 'i'].includes(segments[0])) {
      return 'twitter';
    }
    return undefined;
  }
  return undefined;
}

export function classifySearchResult(
  link: string,
  title: string,
  snippet?: string,
): SearchResultClassification {
  const url = normalizeUrl(link);
  if (!url) return { kind: 'blocked' };

  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  const haystack = `${title} ${snippet ?? ''} ${link}`.toLowerCase();

  if (BLOCKED_HOST_FRAGMENTS.some((f) => host.includes(f))) {
    return { kind: 'blocked' };
  }

  if (DIRECTORY_HOST_FRAGMENTS.some((f) => host.includes(f.replace(/\/.*$/, '')))) {
    return { kind: 'directory' };
  }
  if (DIRECTORY_HOST_FRAGMENTS.some((f) => f.includes('/') && link.toLowerCase().includes(f))) {
    return { kind: 'directory' };
  }
  if (DIRECTORY_PATH_FRAGMENTS.some((f) => path.includes(f))) {
    return { kind: 'directory' };
  }
  if (/\btop\s+\d+\b/.test(haystack) && (path.includes('best') || path.includes('top'))) {
    return { kind: 'directory' };
  }

  if (ARTICLE_HOST_FRAGMENTS.some((f) => host.includes(f))) {
    return { kind: 'article' };
  }
  if (ARTICLE_PATH_FRAGMENTS.some((f) => path.includes(f))) {
    return { kind: 'article' };
  }

  const social = detectSocialPlatform(host, path);
  if (social) return { kind: 'social_profile', platform: social };

  if (host.includes('google.') && path.includes('/maps')) {
    return { kind: 'business_page' };
  }

  return { kind: 'business_page' };
}

export function isKeepableSearchResult(classification: SearchResultClassification): boolean {
  return classification.kind === 'business_page' || classification.kind === 'social_profile';
}
