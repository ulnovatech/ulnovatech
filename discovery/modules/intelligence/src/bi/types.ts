import type { BoIOpportunityIntelligence } from '../boi/types';

export type BiSocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'whatsapp'
  | 'other';

export type BiSocialLink = {
  platform: BiSocialPlatform;
  url: string;
  discoveredVia: 'account' | 'business' | 'crawl' | 'discovery_metadata' | 'link_in_bio';
};

export type BiLinkInBioPage = {
  url: string;
  resolvedAt: string;
  outboundLinks: BiSocialLink[];
  resolvedWebsite?: string | null;
  fetchStatus: 'ok' | 'blocked' | 'unreachable' | 'skipped';
};

export type BiGraphNodeType =
  | 'business'
  | 'website'
  | 'social'
  | 'link_in_bio'
  | 'google_maps';

export type BiGraphNode = {
  id: string;
  type: BiGraphNodeType;
  label: string;
  url?: string;
  platform?: BiSocialPlatform;
};

export type BiGraphEdge = {
  from: string;
  to: string;
  relation: 'owns' | 'listed_on' | 'has_profile' | 'links_to' | 'uses' | 'resolves_to';
  source: BiSocialLink['discoveredVia'] | 'link_in_bio_resolver' | 'account';
};

export type BiRelationshipGraph = {
  nodes: BiGraphNode[];
  edges: BiGraphEdge[];
};

export type BiCompleteness = {
  score: number;
  filledFields: string[];
  missingFields: string[];
};

export type BusinessIntelligenceProfile = {
  schemaVersion: 1 | 2;
  accountId: string;
  businessId: string;
  discoveryRunId?: string;
  enrichedAt: string;

  identity: {
    name: string;
    industry?: string | null;
    city?: string | null;
    country?: string | null;
  };

  contact: {
    email?: string | null;
    phone?: string | null;
    website?: string | null;
  };

  presence: {
    hasWebsite: boolean;
    httpsEnabled?: boolean | null;
    mobileFriendly?: boolean | null;
    googleMapsUrl?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    discoverySource?: string | null;
  };

  digitalFootprint: {
    socialLinks: BiSocialLink[];
    linkInBioPages: BiLinkInBioPage[];
    relationshipGraph: BiRelationshipGraph;
  };

  websiteIntel: {
    crawlStatus?: string | null;
    title?: string | null;
    metaDescription?: string | null;
    pagesFetched?: number;
    pageUrls?: string[];
    analysisNotes?: string | null;
    lastCrawledAt?: string | null;
  };

  infrastructure: InfrastructureAudit;

  businessSignals: BiBusinessSignals;

  /** Business Opportunity Intelligence — synthesized in boi pipeline (chunk 3+). */
  opportunityIntelligence?: BoIOpportunityIntelligence;

  completeness: BiCompleteness;
};

export type BiReviewSnippet = {
  text: string;
  rating?: number | null;
  publishTime?: string | null;
  source: 'google_places';
};

export type BiReviewPainSignal = {
  keyword: string;
  label: string;
  excerpt: string;
  reviewRating?: number | null;
  signalStrength: number;
};

export type BiBusinessSignals = {
  reviewSnippets: BiReviewSnippet[];
  painKeywords: BiReviewPainSignal[];
};

export type InfrastructureCategory = 'booking' | 'ecommerce' | 'email_capture' | 'analytics';

export type InfrastructureConfidence = 'high' | 'medium' | 'low';

export type InfrastructureSignal = {
  category: InfrastructureCategory;
  vendor: string;
  evidence: string;
  confidence: InfrastructureConfidence;
};

export type InfrastructureFlags = {
  hasOnlineBooking: boolean;
  hasEcommerce: boolean;
  hasEmailCapture: boolean;
  hasAnalytics: boolean;
};

export type InfrastructureAudit = {
  booking: InfrastructureSignal[];
  ecommerce: InfrastructureSignal[];
  emailCapture: InfrastructureSignal[];
  analytics: InfrastructureSignal[];
  flags: InfrastructureFlags;
  opportunityFlags: string[];
};

export type BiEnrichRunResult = {
  enriched: number;
  skippedNoAccount: number;
  averageCompleteness: number;
  linkInBioResolved: number;
};
