import type { BiSocialLink, BiBusinessSignals, BusinessIntelligenceProfile, InfrastructureAudit } from './types';
import { attachOpportunityIntelligenceShell } from '../boi/normalize-bi-profile';
import { computeBiCompleteness } from './compute-completeness';
import { mergeSocialLinks, socialLinkFromUrl } from './social-links';
import {
  buildBusinessSignalsFromReviews,
  readPlacesReviewsFromMetadata,
} from '@agency/discovery';
import {
  emptyInfrastructureAudit,
  finalizeInfrastructureAudit,
} from '../crawl/infrastructure-audit';

export type BiBuildAccount = {
  id: string;
  canonicalName: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  country?: string | null;
  industry?: string | null;
  source?: string | null;
  googleMapsUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  crawlStatus?: string | null;
  lastCrawledAt?: Date | null;
  metadata?: Record<string, unknown> | null;
};

export type BiBuildBusiness = {
  id: string;
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  country?: string | null;
  source: string;
  googleMapsUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type BiBuildAnalysis = {
  hasWebsite: boolean;
  mobileFriendly?: boolean | null;
  httpsEnabled?: boolean | null;
  notes?: string | null;
};

type CrawlMetadata = {
  pagesFetched?: number;
  pageUrls?: string[];
  title?: string;
  metaDescription?: string;
  whatsappUrl?: string;
  socialUrls?: string[];
  linkInBioUrls?: string[];
  infrastructureAudit?: InfrastructureAudit;
};

function readCrawlMetadata(account: BiBuildAccount | null): CrawlMetadata {
  const crawl = account?.metadata?.crawl as CrawlMetadata | undefined;
  return crawl ?? {};
}

function metadataUrl(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function collectSocialLinks(account: BiBuildAccount | null, business: BiBuildBusiness): BiSocialLink[] {
  const links: BiSocialLink[] = [];

  for (const url of [account?.facebookUrl, business.facebookUrl]) {
    const link = socialLinkFromUrl(url, account?.facebookUrl === url ? 'account' : 'business');
    if (link) links.push(link);
  }
  for (const url of [account?.instagramUrl, business.instagramUrl]) {
    const link = socialLinkFromUrl(url, account?.instagramUrl === url ? 'account' : 'business');
    if (link) links.push(link);
  }

  for (const [key, via] of [
    ['tiktokUrl', 'discovery_metadata'],
    ['linkedinUrl', 'discovery_metadata'],
    ['youtubeUrl', 'discovery_metadata'],
    ['twitterUrl', 'discovery_metadata'],
  ] as const) {
    const url = metadataUrl(business.metadata, key);
    const link = socialLinkFromUrl(url, via);
    if (link) links.push(link);
  }

  const crawl = readCrawlMetadata(account);
  const whatsappLink = socialLinkFromUrl(crawl.whatsappUrl, 'crawl');
  if (whatsappLink) links.push(whatsappLink);

  for (const url of crawl.socialUrls ?? []) {
    const link = socialLinkFromUrl(url, 'crawl');
    if (link) links.push(link);
  }

  return mergeSocialLinks(links);
}

function emptyBusinessSignals(): BiBusinessSignals {
  return { reviewSnippets: [], painKeywords: [] };
}

function buildBusinessSignals(business: BiBuildBusiness): BiBusinessSignals {
  const reviews = readPlacesReviewsFromMetadata(business.metadata);
  if (reviews.length === 0) return emptyBusinessSignals();
  const signals = buildBusinessSignalsFromReviews(reviews);
  return {
    reviewSnippets: signals.reviewSnippets,
    painKeywords: signals.painKeywords,
  };
}

export function buildBusinessIntelligenceProfile(input: {
  account: BiBuildAccount;
  business: BiBuildBusiness;
  analysis: BiBuildAnalysis | null;
  discoveryRunId?: string;
  footprint?: BusinessIntelligenceProfile['digitalFootprint'];
}): BusinessIntelligenceProfile {
  const { account, business, analysis, discoveryRunId, footprint } = input;
  const crawl = readCrawlMetadata(account);

  const email = business.email ?? account.email ?? null;
  const phone = business.phone ?? account.phone ?? null;
  const website = business.website ?? account.website ?? null;

  const infrastructure = finalizeInfrastructureAudit(
    crawl.infrastructureAudit ?? emptyInfrastructureAudit(),
    {
      crawled: !!crawl.infrastructureAudit,
      crawlStatus: account.crawlStatus ?? null,
      hasWebsite: analysis?.hasWebsite ?? !!website?.trim(),
    },
  );

  const base: Omit<BusinessIntelligenceProfile, 'completeness' | 'schemaVersion' | 'opportunityIntelligence'> = {
    accountId: account.id,
    businessId: business.id,
    discoveryRunId,
    enrichedAt: new Date().toISOString(),
    identity: {
      name: business.name || account.canonicalName,
      industry: business.industry ?? account.industry ?? null,
      city: business.city ?? account.city ?? null,
      country: business.country ?? account.country ?? null,
    },
    contact: {
      email,
      phone,
      website,
    },
    presence: {
      hasWebsite: analysis?.hasWebsite ?? !!website?.trim(),
      httpsEnabled: analysis?.httpsEnabled ?? null,
      mobileFriendly: analysis?.mobileFriendly ?? null,
      googleMapsUrl: business.googleMapsUrl ?? account.googleMapsUrl ?? null,
      rating: business.rating ?? account.rating ?? null,
      reviewCount: business.reviewCount ?? account.reviewCount ?? null,
      discoverySource: business.source ?? account.source ?? null,
    },
    digitalFootprint: {
      socialLinks: footprint?.socialLinks ?? collectSocialLinks(account, business),
      linkInBioPages: footprint?.linkInBioPages ?? [],
      relationshipGraph: footprint?.relationshipGraph ?? { nodes: [], edges: [] },
    },
    websiteIntel: {
      crawlStatus: account.crawlStatus ?? null,
      title: crawl.title ?? null,
      metaDescription: crawl.metaDescription ?? null,
      pagesFetched: crawl.pagesFetched,
      pageUrls: crawl.pageUrls,
      analysisNotes: analysis?.notes ?? null,
      lastCrawledAt: account.lastCrawledAt?.toISOString() ?? null,
    },
    infrastructure,
    businessSignals: buildBusinessSignals(business),
  };

  return attachOpportunityIntelligenceShell({
    ...base,
    completeness: computeBiCompleteness({ ...base, schemaVersion: 2 }),
  });
}

export function readCrawlFootprintSources(account: BiBuildAccount | null, website?: string | null) {
  const crawl = readCrawlMetadata(account);
  return {
    crawlSocialUrls: crawl.socialUrls ?? [],
    crawlLinkInBioUrls: crawl.linkInBioUrls ?? [],
    website: website ?? account?.website ?? null,
  };
}
