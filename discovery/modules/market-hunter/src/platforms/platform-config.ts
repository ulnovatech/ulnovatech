import type { MarketHunterPlatformKey } from '../types';
import type { PlatformMechanics, PlatformRole } from './base.adapter';

export type PlatformConfigEntry = {
  key: MarketHunterPlatformKey;
  label: string;
  baseUrl: string;
  role: PlatformRole;
  categories: string[];
  mechanics: PlatformMechanics;
  /** When false, listings are Type-1 demand signals only — never action cards alone. */
  supportsGapScoring: boolean;
};

export const PLATFORM_CONFIG: Record<MarketHunterPlatformKey, PlatformConfigEntry> = {
  codecanyon: {
    key: 'codecanyon',
    label: 'CodeCanyon',
    baseUrl: 'https://codecanyon.net',
    role: 'marketplace',
    categories: ['mobile/react-native', 'mobile/flutter', 'javascript', 'php-scripts'],
    supportsGapScoring: true,
    mechanics: {
      hasNewListingBoost: true,
      newListingBoostDurationDays: 7,
      defaultSortOrder: 'best_selling',
      trendingRequiresVelocity: true,
      velocityWindowDays: 30,
      keywordsAffectRanking: true,
      minimumSalesForVisibility: 0,
    },
  },
  getly: {
    key: 'getly',
    label: 'Getly',
    baseUrl: 'https://getly.store',
    role: 'marketplace',
    categories: ['developer-tools', 'templates', 'design-assets'],
    supportsGapScoring: true,
    mechanics: {
      hasNewListingBoost: true,
      newListingBoostDurationDays: 14,
      defaultSortOrder: 'newest',
      trendingRequiresVelocity: false,
      keywordsAffectRanking: true,
      minimumSalesForVisibility: 0,
    },
  },
  gumroad: {
    key: 'gumroad',
    label: 'Gumroad',
    baseUrl: 'https://gumroad.com',
    role: 'marketplace',
    categories: ['software', 'templates', 'design'],
    supportsGapScoring: true,
    mechanics: {
      hasNewListingBoost: false,
      newListingBoostDurationDays: 0,
      defaultSortOrder: 'relevance',
      trendingRequiresVelocity: false,
      keywordsAffectRanking: false,
      minimumSalesForVisibility: 0,
    },
  },
  producthunt: {
    key: 'producthunt',
    label: 'Product Hunt',
    baseUrl: 'https://producthunt.com',
    role: 'marketplace',
    categories: ['developer-tools', 'productivity', 'design-tools'],
    supportsGapScoring: true,
    mechanics: {
      hasNewListingBoost: true,
      newListingBoostDurationDays: 1,
      defaultSortOrder: 'newest',
      trendingRequiresVelocity: true,
      velocityWindowDays: 1,
      keywordsAffectRanking: false,
      minimumSalesForVisibility: 0,
    },
  },
  g2: {
    key: 'g2',
    label: 'G2',
    baseUrl: 'https://www.g2.com',
    role: 'review_signal',
    categories: ['developer-tools', 'crm', 'marketing-automation'],
    supportsGapScoring: false,
    mechanics: {
      hasNewListingBoost: false,
      newListingBoostDurationDays: 0,
      defaultSortOrder: 'relevance',
      trendingRequiresVelocity: false,
      keywordsAffectRanking: true,
      minimumSalesForVisibility: 0,
    },
  },
  reddit: {
    key: 'reddit',
    label: 'Reddit (Type 1 signals)',
    baseUrl: 'https://www.reddit.com',
    role: 'demand_signal',
    categories: ['webdev', 'SaaS', 'Entrepreneur', 'sideproject'],
    supportsGapScoring: false,
    mechanics: {
      hasNewListingBoost: false,
      newListingBoostDurationDays: 0,
      defaultSortOrder: 'newest',
      trendingRequiresVelocity: true,
      velocityWindowDays: 7,
      keywordsAffectRanking: false,
      minimumSalesForVisibility: 0,
    },
  },
};

const SORT_ORDERS = new Set(['best_selling', 'newest', 'relevance', 'trending']);

export function validatePlatformConfig(entry: PlatformConfigEntry): string[] {
  const errors: string[] = [];
  if (!entry.key?.trim()) errors.push('missing key');
  if (!entry.label?.trim()) errors.push('missing label');
  if (!entry.baseUrl?.startsWith('https://')) errors.push('baseUrl must be https');
  if (!entry.categories.length) errors.push('at least one category required');
  if (!SORT_ORDERS.has(entry.mechanics.defaultSortOrder)) {
    errors.push(`invalid defaultSortOrder: ${entry.mechanics.defaultSortOrder}`);
  }
  if (entry.mechanics.minimumSalesForVisibility < 0) {
    errors.push('minimumSalesForVisibility must be >= 0');
  }
  if (!entry.mechanics.hasNewListingBoost && entry.mechanics.newListingBoostDurationDays > 0) {
    errors.push('newListingBoostDurationDays must be 0 when hasNewListingBoost is false');
  }
  if (entry.mechanics.trendingRequiresVelocity && entry.mechanics.velocityWindowDays == null) {
    errors.push('velocityWindowDays required when trendingRequiresVelocity is true');
  }
  return errors;
}

export function validateAllPlatformConfigs(): { valid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(PLATFORM_CONFIG)) {
    const found = validatePlatformConfig(entry);
    if (found.length > 0) errors[key] = found;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function getDefaultPlatformCategories(key: MarketHunterPlatformKey): string[] {
  return PLATFORM_CONFIG[key].categories;
}

export function getPlatformConfig(key: MarketHunterPlatformKey): PlatformConfigEntry {
  return PLATFORM_CONFIG[key];
}
