import type { BiSocialLink, BiSocialPlatform } from './types';

export function detectSocialPlatform(url: string): BiSocialPlatform {
  const lower = url.toLowerCase();
  if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('instagram.com')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('linkedin.com')) return 'linkedin';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
  if (lower.includes('wa.me') || lower.includes('whatsapp.com')) return 'whatsapp';
  return 'other';
}

function normalizeSocialUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.href.replace(/\/$/, '');
  } catch {
    return url.trim();
  }
}

export function mergeSocialLinks(links: BiSocialLink[]): BiSocialLink[] {
  const seen = new Set<string>();
  const merged: BiSocialLink[] = [];

  for (const link of links) {
    const key = `${link.platform}:${normalizeSocialUrl(link.url)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({ ...link, url: normalizeSocialUrl(link.url) });
  }

  return merged;
}

export function socialLinkFromUrl(
  url: string | null | undefined,
  discoveredVia: BiSocialLink['discoveredVia'],
): BiSocialLink | null {
  if (!url?.trim()) return null;
  return {
    platform: detectSocialPlatform(url),
    url: url.trim(),
    discoveredVia,
  };
}
