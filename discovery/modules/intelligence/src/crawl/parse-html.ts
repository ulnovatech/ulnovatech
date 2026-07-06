import {
  extractSocialUrlsFromHtml,
  mergeExtractedSocial,
  type ExtractedSocialUrls,
} from './extract-social-links';

export interface ParsedPageData {
  title?: string;
  metaDescription?: string;
  mobileFriendly: boolean;
  email?: string;
  phone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  tiktokUrl?: string;
  linkedinUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  socialUrls?: string[];
  linkInBioUrls?: string[];
}

function firstMatch(html: string, pattern: RegExp): string | undefined {
  const m = html.match(pattern);
  return m?.[1]?.trim();
}

export function extractTitle(html: string): string | undefined {
  return firstMatch(html, /<title[^>]*>([^<]+)<\/title>/i);
}

export function extractMetaDescription(html: string): string | undefined {
  return (
    firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ??
    firstMatch(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  );
}

export function hasViewportMeta(html: string): boolean {
  return /<meta[^>]+name=["']viewport["']/i.test(html);
}

export function extractMailto(html: string): string | undefined {
  const raw = firstMatch(html, /mailto:([^\s"'<>?]+)/i);
  if (!raw) return undefined;
  return raw.split('?')[0].trim();
}

export function extractTel(html: string): string | undefined {
  return firstMatch(html, /tel:([+\d\s().-]+)/i);
}

export function extractSocialLinks(html: string, baseUrl: string): Pick<ParsedPageData, 'facebookUrl' | 'instagramUrl' | 'whatsappUrl' | 'tiktokUrl' | 'linkedinUrl' | 'youtubeUrl' | 'twitterUrl' | 'socialUrls' | 'linkInBioUrls'> {
  const extracted = extractSocialUrlsFromHtml(html, baseUrl);
  return {
    facebookUrl: extracted.byPlatform.facebook,
    instagramUrl: extracted.byPlatform.instagram,
    whatsappUrl: extracted.byPlatform.whatsapp,
    tiktokUrl: extracted.byPlatform.tiktok,
    linkedinUrl: extracted.byPlatform.linkedin,
    youtubeUrl: extracted.byPlatform.youtube,
    twitterUrl: extracted.byPlatform.twitter,
    socialUrls: extracted.socialUrls,
    linkInBioUrls: extracted.linkInBioUrls,
  };
}

export function extractJsonLdContacts(html: string): Pick<ParsedPageData, 'email' | 'phone'> {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let email: string | undefined;
  let phone: string | undefined;

  for (const [, jsonText] of scripts) {
    try {
      const data = JSON.parse(jsonText.trim());
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (!email && typeof node.email === 'string') email = node.email.trim();
        if (!phone && typeof node.telephone === 'string') phone = node.telephone.trim();
      }
    } catch {
      continue;
    }
  }

  return { email, phone };
}

export function parseHtmlPage(html: string, pageUrl: string): ParsedPageData {
  const jsonLd = extractJsonLdContacts(html);
  const social = extractSocialLinks(html, pageUrl);

  return {
    title: extractTitle(html),
    metaDescription: extractMetaDescription(html),
    mobileFriendly: hasViewportMeta(html),
    email: extractMailto(html) ?? jsonLd.email,
    phone: extractTel(html) ?? jsonLd.phone,
    ...social,
  };
}

export function mergePageData(pages: ParsedPageData[]): ParsedPageData {
  const merged: ParsedPageData = { mobileFriendly: false };
  const socialExtractions: ExtractedSocialUrls[] = [];

  for (const page of pages) {
    if (page.title && !merged.title) merged.title = page.title;
    if (page.metaDescription && !merged.metaDescription) merged.metaDescription = page.metaDescription;
    if (page.mobileFriendly) merged.mobileFriendly = true;
    if (page.email && !merged.email) merged.email = page.email;
    if (page.phone && !merged.phone) merged.phone = page.phone;
    if (page.facebookUrl && !merged.facebookUrl) merged.facebookUrl = page.facebookUrl;
    if (page.instagramUrl && !merged.instagramUrl) merged.instagramUrl = page.instagramUrl;
    if (page.whatsappUrl && !merged.whatsappUrl) merged.whatsappUrl = page.whatsappUrl;
    if (page.tiktokUrl && !merged.tiktokUrl) merged.tiktokUrl = page.tiktokUrl;
    if (page.linkedinUrl && !merged.linkedinUrl) merged.linkedinUrl = page.linkedinUrl;
    if (page.youtubeUrl && !merged.youtubeUrl) merged.youtubeUrl = page.youtubeUrl;
    if (page.twitterUrl && !merged.twitterUrl) merged.twitterUrl = page.twitterUrl;

    if (page.socialUrls?.length || page.linkInBioUrls?.length) {
      socialExtractions.push({
        socialUrls: page.socialUrls ?? [],
        linkInBioUrls: page.linkInBioUrls ?? [],
        byPlatform: {
          facebook: page.facebookUrl,
          instagram: page.instagramUrl,
          whatsapp: page.whatsappUrl,
          tiktok: page.tiktokUrl,
          linkedin: page.linkedinUrl,
          youtube: page.youtubeUrl,
          twitter: page.twitterUrl,
        },
      });
    }
  }

  if (socialExtractions.length > 0) {
    const combined = mergeExtractedSocial(socialExtractions);
    merged.socialUrls = combined.socialUrls;
    merged.linkInBioUrls = combined.linkInBioUrls;
    merged.facebookUrl = merged.facebookUrl ?? combined.byPlatform.facebook;
    merged.instagramUrl = merged.instagramUrl ?? combined.byPlatform.instagram;
    merged.whatsappUrl = merged.whatsappUrl ?? combined.byPlatform.whatsapp;
    merged.tiktokUrl = merged.tiktokUrl ?? combined.byPlatform.tiktok;
    merged.linkedinUrl = merged.linkedinUrl ?? combined.byPlatform.linkedin;
    merged.youtubeUrl = merged.youtubeUrl ?? combined.byPlatform.youtube;
    merged.twitterUrl = merged.twitterUrl ?? combined.byPlatform.twitter;
  }

  return merged;
}
