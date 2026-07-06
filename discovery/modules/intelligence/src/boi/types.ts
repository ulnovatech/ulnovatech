export type BoIEvidenceSource =
  | 'bi_profile'
  | 'intent_signal'
  | 'google_places_review'
  | 'website_crawl'
  | 'discovery';

export type BoIEvidence = {
  id: string;
  source: BoIEvidenceSource;
  label: string;
  excerpt?: string | null;
  url?: string | null;
  capturedAt?: string | null;
};

export type BoIGapSeverity = 'high' | 'medium' | 'low';

export type BoIDigitalGap = {
  id: string;
  category: string;
  label: string;
  severity: BoIGapSeverity;
  confidence: number;
  evidenceIds: string[];
};

export type BoIStructuredPain = {
  id: string;
  label: string;
  confidence: number;
  evidenceIds: string[];
  sources: BoIEvidenceSource[];
};

export type BoISolutionBenefit = {
  label: string;
};

export type BoISolution = {
  id: string;
  service: string;
  painIds: string[];
  benefits: BoISolutionBenefit[];
};

export type BoIReadinessBand = 'high' | 'medium' | 'low' | 'unknown';

export type BoIPurchaseReadiness = {
  score: number | null;
  band: BoIReadinessBand;
  factors: Array<{ key: string; label: string; weight: number }>;
  computedAt: string;
};

export type BoINarrativeSource = 'rules' | 'llm';

export type BoISalesBrief = {
  executiveSummary?: string | null;
  narrativeSource?: BoINarrativeSource | null;
  pitchAngle?: string | null;
  recommendedServices: string[];
  topPainIds?: string[];
  gapIds?: string[];
  evidenceIds?: string[];
  opportunityType?: string | null;
};

export type BoIOpportunityStatus = 'pending' | 'ready' | 'partial';

export type BoISentimentThemeKind = 'praise' | 'complaint';

export type BoISentimentTheme = {
  id: string;
  kind: BoISentimentThemeKind;
  label: string;
  mentionCount: number;
  confidence: number;
  sampleExcerpt?: string | null;
};

export type BoISentimentSummary = {
  overallRating?: number | null;
  reviewCount: number;
  praiseThemes: BoISentimentTheme[];
  complaintThemes: BoISentimentTheme[];
  synthesizedAt: string;
};

export type BoITechStackCategory =
  | 'cms'
  | 'booking'
  | 'ecommerce'
  | 'analytics'
  | 'email_capture'
  | 'payments';

export type BoITechStackItem = {
  category: BoITechStackCategory;
  vendor: string;
  label: string;
  confidence: 'high' | 'medium' | 'low';
};

export type BoITechStack = {
  detected: BoITechStackItem[];
  source: 'website_crawl' | 'bi_profile' | 'none';
};

export type BoIProjectValueBand = 'starter' | 'growth' | 'premium';

export type BoIProjectValueEstimate = {
  currency: 'UGX';
  band: BoIProjectValueBand;
  minUgx: number;
  maxUgx: number;
  disclaimer: 'estimate';
  factors: string[];
};

export type BoIPageSpeedSnapshot = {
  performanceScore: number;
  strategy: 'mobile';
  capturedAt: string;
};

/** Versioned BOI payload stored on BusinessIntelligenceProfile.opportunityIntelligence */
export type BoIOpportunityIntelligence = {
  schemaVersion: 1;
  status: BoIOpportunityStatus;
  synthesizedAt: string | null;
  evidence: BoIEvidence[];
  digitalGaps: BoIDigitalGap[];
  pains: BoIStructuredPain[];
  solutions: BoISolution[];
  purchaseReadiness: BoIPurchaseReadiness | null;
  salesBrief: BoISalesBrief | null;
  sentimentSummary: BoISentimentSummary | null;
  techStack: BoITechStack | null;
  projectValue: BoIProjectValueEstimate | null;
  pageSpeed: BoIPageSpeedSnapshot | null;
};
