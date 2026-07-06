/** Hosts too generic for business-domain dedup (mail providers + social link hubs). */
export const GENERIC_OR_SOCIAL_HOSTS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'gmx.com',
  'yandex.com',
  'zoho.com',
  'fastmail.com',
  'facebook.com',
  'fb.com',
  'instagram.com',
  'linktr.ee',
  'google.com',
  'maps.google.com',
  'business.site',
  'wixsite.com',
  'wordpress.com',
  'blogspot.com',
  'square.site',
]);

export function isGenericOrSocialHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (GENERIC_OR_SOCIAL_HOSTS.has(lower)) return true;
  return [...GENERIC_OR_SOCIAL_HOSTS].some(
    (generic) => lower === generic || lower.endsWith(`.${generic}`),
  );
}

export function extractDomainFromWebsite(website?: string | null): string | null {
  if (!website?.trim()) return null;

  const raw = website.trim();
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProto);
    let host = url.hostname.toLowerCase();
    if (host.startsWith('www.')) host = host.slice(4);
    return host || null;
  } catch {
    const fallback = raw
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      ?.split(':')[0]
      ?.toLowerCase()
      .replace(/^www\./, '');
    return fallback || null;
  }
}

export function extractDomainFromEmail(email?: string | null): string | null {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !trimmed.includes('@')) return null;
  const domain = trimmed.split('@').pop();
  return domain || null;
}

/** Prefer website domain; fall back to email domain when not generic/social. */
export function extractBusinessDomain(input: {
  website?: string | null;
  email?: string | null;
}): string | null {
  const fromWebsite = extractDomainFromWebsite(input.website);
  if (fromWebsite && !isGenericOrSocialHost(fromWebsite)) return fromWebsite;

  const fromEmail = extractDomainFromEmail(input.email);
  if (fromEmail && !isGenericOrSocialHost(fromEmail)) return fromEmail;

  return null;
}
