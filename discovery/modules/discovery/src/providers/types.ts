export type DiscoverySource =
  | 'google_maps'
  | 'public_search'
  | 'social_search'
  | 'facebook'
  | 'instagram'
  | 'csv_import'
  | 'manual'
  | 'demand_inbox';

export interface DiscoveredBusiness {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  source: DiscoverySource;
  sourceUrl?: string;
  externalId?: string;
  googleMapsUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  rating?: number;
  reviewCount?: number;
  metadata?: Record<string, unknown>;
}

export interface DiscoverySearchParams {
  country: string;
  city: string;
  industry: string;
  /** Per-run profile mode — overrides global acquisition mode for this discover pass */
  acquisitionMode?: 'economy' | 'standard' | 'boost';
  /** Bias search queries toward high-potential prospect templates */
  prospectFocus?: boolean;
}

export interface DiscoveryProvider {
  readonly name: DiscoverySource;
  readonly label: string;
  isConfigured(): boolean | Promise<boolean>;
  discover(params: DiscoverySearchParams): Promise<DiscoveredBusiness[]>;
}
