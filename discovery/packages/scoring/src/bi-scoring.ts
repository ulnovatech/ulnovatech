/** Plain BI snapshot for scoring — no dependency on @agency/intelligence. */
export type BiScoringInput = {
  hasWebsite: boolean;
  website?: string | null;
  socialLinkCount: number;
  linkInBioPageCount: number;
  resolvedWebsiteFromBio?: string | null;
  opportunityFlags: string[];
  infrastructureFlags?: {
    hasOnlineBooking: boolean;
    hasEmailCapture: boolean;
    hasAnalytics: boolean;
    hasEcommerce: boolean;
  };
  socialPlatforms?: string[];
};

export type BiScoringHints = {
  linktreeOnly: boolean;
  socialOnlyPresence: boolean;
  missingOnlineBooking: boolean;
  missingEmailCapture: boolean;
  missingAnalytics: boolean;
  needsLeadGen: boolean;
  socialPlatformCount: number;
  primaryPlatform: string | null;
};

const LINK_IN_BIO_HOSTS = [
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

export function isLinkInBioWebsite(url?: string | null): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
      .hostname.toLowerCase()
      .replace(/^www\./, '');
    return LINK_IN_BIO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

export function hasRealWebsite(input: Pick<BiScoringInput, 'hasWebsite' | 'website' | 'resolvedWebsiteFromBio'>): boolean {
  const candidate = input.resolvedWebsiteFromBio ?? input.website;
  if (candidate?.trim() && !isLinkInBioWebsite(candidate)) return true;
  return input.hasWebsite && !!candidate?.trim() && !isLinkInBioWebsite(candidate);
}

export function deriveBiScoringHints(input: BiScoringInput): BiScoringHints {
  const realWebsite = hasRealWebsite(input);
  const websiteIsLinkInBio = isLinkInBioWebsite(input.website);
  const linktreeOnly =
    websiteIsLinkInBio ||
    (!realWebsite && (input.linkInBioPageCount > 0 || input.opportunityFlags.includes('link_in_bio_only')));

  const socialOnlyPresence =
    !realWebsite && input.socialLinkCount > 0 && (linktreeOnly || !input.hasWebsite);

  const missingOnlineBooking =
    input.opportunityFlags.includes('missing_online_booking') ||
    (realWebsite && input.infrastructureFlags?.hasOnlineBooking === false);
  const missingEmailCapture =
    input.opportunityFlags.includes('missing_email_capture') ||
    (realWebsite && input.infrastructureFlags?.hasEmailCapture === false);
  const missingAnalytics =
    input.opportunityFlags.includes('missing_analytics') ||
    (realWebsite && input.infrastructureFlags?.hasAnalytics === false);

  const platforms = input.socialPlatforms ?? [];
  const primaryPlatform = platforms[0] ?? null;

  return {
    linktreeOnly,
    socialOnlyPresence,
    missingOnlineBooking,
    missingEmailCapture,
    missingAnalytics,
    needsLeadGen: missingEmailCapture || missingAnalytics,
    socialPlatformCount: input.socialLinkCount,
    primaryPlatform,
  };
}

export function applyBiScoringFactors(
  factors: Record<string, number>,
  hints: BiScoringHints,
): Record<string, number> {
  const next = { ...factors };

  if (hints.socialOnlyPresence) next.socialOnlyPresence = 12;
  if (hints.linktreeOnly) next.linktreeOnly = 8;
  if (hints.missingOnlineBooking) next.noBooking = 6;
  if (hints.missingEmailCapture) next.missingEmailCapture = 5;
  if (hints.missingAnalytics) next.missingAnalytics = 4;
  if (hints.needsLeadGen && !hints.missingEmailCapture && !hints.missingAnalytics) {
    next.needsLeadGen = 5;
  }

  return next;
}

export function biScoringInputFromProfile(profile: {
  contact: { website?: string | null };
  presence: { hasWebsite: boolean };
  digitalFootprint: {
    socialLinks: Array<{ platform: string }>;
    linkInBioPages: Array<{ resolvedWebsite?: string | null }>;
  };
  infrastructure: {
    opportunityFlags: string[];
    flags: {
      hasOnlineBooking: boolean;
      hasEmailCapture: boolean;
      hasAnalytics: boolean;
      hasEcommerce: boolean;
    };
  };
}): BiScoringInput {
  const resolvedWebsiteFromBio = profile.digitalFootprint.linkInBioPages.find(
    (p) => p.resolvedWebsite?.trim(),
  )?.resolvedWebsite;

  return {
    hasWebsite: profile.presence.hasWebsite,
    website: profile.contact.website,
    socialLinkCount: profile.digitalFootprint.socialLinks.length,
    linkInBioPageCount: profile.digitalFootprint.linkInBioPages.length,
    resolvedWebsiteFromBio: resolvedWebsiteFromBio ?? null,
    opportunityFlags: profile.infrastructure.opportunityFlags,
    infrastructureFlags: profile.infrastructure.flags,
    socialPlatforms: profile.digitalFootprint.socialLinks.map((s) => s.platform),
  };
}

export const BI_OPPORTUNITY_FLAG_LABELS: Record<string, string> = {
  missing_analytics: 'No analytics detected',
  missing_email_capture: 'No email capture',
  missing_online_booking: 'No online booking',
  missing_ecommerce: 'No ecommerce',
  no_website: 'No website',
  crawl_blocked: 'Crawl blocked',
  website_unreachable: 'Website unreachable',
};

export function footprintChipLabels(platforms: string[]): string[] {
  const labels: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    twitter: 'X / Twitter',
    whatsapp: 'WhatsApp',
    other: 'Social',
  };
  return [...new Set(platforms)].map((p) => labels[p] ?? p);
}
