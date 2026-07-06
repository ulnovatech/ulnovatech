/** Hunter UI types — mirrors API payloads without agency lead/BOI types. */

export type HunterScanStats = {
  listingsFetched?: number;
  ghostsFiltered?: number;
  cardsGenerated?: number;
  spendUsd?: number;
  type1Flags?: Array<{
    platform: string;
    category: string;
    title: string;
    url: string;
    signal: string;
  }>;
  byPlatform?: Record<
    string,
    { listings: number; ghosts: number; cards: number; categories: number; type1Signals?: number }
  >;
};

export type HunterScan = {
  id: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  stats: HunterScanStats | null;
  errorMessage: string | null;
  createdAt: string;
};

export type HunterActionCardPayload = {
  rank: number;
  gapScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  platform: string;
  originalProduct: string;
  originalUrl: string;
  originalPrice: number;
  originalSales: number;
  gapType: 'TYPE_2' | 'TYPE_3';
  buildSpec: {
    coreScope: string;
    differentiators: string[];
    estimatedBuildDays: number;
    recommendedPrice: number;
  };
  visibilityPlan: {
    exploitableWindow: string;
    keywordSuggestions: string[];
    risk: string;
    recommendation: string;
  };
  paymentPath: string;
  approvedForBuild: boolean;
  listingKey: string;
};

export type HunterActionCardRow = {
  id: string;
  scanId: string;
  rank: number;
  status: 'pending' | 'approved' | 'dismissed';
  card: HunterActionCardPayload;
  approvedAt: string | null;
  dismissedAt: string | null;
  createdAt: string;
};

export type HunterHealth = {
  product: string;
  enabled: boolean;
  ready: boolean;
  message?: string;
  settings: {
    maxSpendPerRunUsd: number;
    defaultListingLimit: number;
    scheduleCron: string;
    researchProvider: string;
    researchModel: string;
    complaintsProvider: string;
    complaintsModel: string;
  };
  credentials: Array<{
    key: string;
    label: string;
    configured: boolean;
    source: string;
    requiredFor?: 'research' | 'complaints' | 'optional';
  }>;
  platforms: Array<{
    key: string;
    label: string;
    enabled: boolean;
    configured: boolean;
    adapterReady: boolean;
  }>;
};

export type HunterBudget = {
  maxSpendPerRunUsd: number;
  totalSpendUsd: number;
  recentSpend: Array<{
    id: string;
    scanId: string | null;
    provider: string;
    operation: string;
    costUsd: number;
    units: number;
    createdAt: string;
  }>;
};
