export type MarketHunterPlatformKey =
  | 'codecanyon'
  | 'getly'
  | 'gumroad'
  | 'producthunt'
  | 'g2'
  | 'reddit';

export const MARKET_HUNTER_PLATFORMS: MarketHunterPlatformKey[] = [
  'codecanyon',
  'getly',
  'gumroad',
  'producthunt',
  'g2',
  'reddit',
];

export type MhScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

export type MhScanJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type MhActionCardStatus = 'pending' | 'approved' | 'dismissed';

export type MhSpendProvider = 'grok' | 'claude' | 'openrouter' | 'anthropic';

export type MarketHunterScan = {
  id: string;
  status: MhScanStatus;
  startedAt: string | null;
  completedAt: string | null;
  stats: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
};

export type MarketHunterPlatformHealth = {
  key: MarketHunterPlatformKey;
  label: string;
  enabled: boolean;
  configured: boolean;
  adapterReady: boolean;
};

export type MarketHunterCredentialHealth = {
  key: 'openrouter_api_key' | 'xai_grok_api_key' | 'anthropic_api_key';
  label: string;
  configured: boolean;
  source: 'env' | 'database' | 'none';
  requiredFor: 'research' | 'complaints' | 'optional';
};

export type MarketHunterHealth = {
  product: 'Live Market Hunter';
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
  credentials: MarketHunterCredentialHealth[];
  platforms: MarketHunterPlatformHealth[];
};
