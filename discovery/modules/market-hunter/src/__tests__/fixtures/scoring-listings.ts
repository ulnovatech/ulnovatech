import type { MarketplaceListing } from '../platforms/base.adapter';
import { getPlatformConfig } from '../../platforms/platform-config';

const AS_OF = new Date('2026-06-30T12:00:00.000Z');

function d(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export const SCORING_AS_OF = AS_OF;

export const ghostListing: MarketplaceListing = {
  id: 'ghost-1',
  platform: 'codecanyon',
  title: 'Abandoned Widget',
  price: 19,
  salesCount: 1,
  lastUpdatedDate: d('2023-01-01'),
  publishedDate: d('2023-01-01'),
  tags: ['widget'],
  reviewCount: 0,
  averageRating: 0,
  sellerName: 'Ghost Seller',
  category: 'javascript',
  url: 'https://codecanyon.net/item/ghost-1/111',
};

export const type2Listing: MarketplaceListing = {
  id: 'type2-1',
  platform: 'codecanyon',
  title: 'React Native Commerce Kit',
  price: 59,
  salesCount: 450,
  lastUpdatedDate: d('2024-02-01'),
  publishedDate: d('2021-05-01'),
  tags: ['react-native', 'ecommerce'],
  reviewCount: 120,
  averageRating: 4.2,
  sellerName: 'Mobile Labs',
  category: 'mobile/react-native',
  url: 'https://codecanyon.net/item/react-native-commerce/222',
};

export const type3Listing: MarketplaceListing = {
  id: 'type3-1',
  platform: 'codecanyon',
  title: 'Flutter Admin Panel',
  price: 39,
  salesCount: 200,
  lastUpdatedDate: d('2023-01-15'),
  publishedDate: d('2020-06-01'),
  tags: ['flutter', 'admin'],
  reviewCount: 45,
  averageRating: 4.5,
  sellerName: 'Flutter Co',
  category: 'mobile/flutter',
  url: 'https://codecanyon.net/item/flutter-admin/333',
};

export const type2Complaints = {
  topComplaints: [
    {
      complaint: 'Checkout flow breaks on iOS 17',
      frequency: 8,
      isTechnical: true,
      fixDifficulty: 'MEDIUM' as const,
    },
    {
      complaint: 'Documentation outdated for latest RN version',
      frequency: 5,
      isTechnical: true,
      fixDifficulty: 'LOW' as const,
    },
  ],
  buildableFixes: ['Fix iOS 17 checkout', 'Update docs for RN 0.74'],
  estimatedFixTimeDays: 14,
  confidenceScore: 82,
};

export const emptyComplaints = {
  topComplaints: [],
  buildableFixes: [],
  estimatedFixTimeDays: 0,
  confidenceScore: 0,
};

export const gumroadMechanics = getPlatformConfig('gumroad').mechanics;
export const codecanyonMechanics = getPlatformConfig('codecanyon').mechanics;

export const fixtureListings: MarketplaceListing[] = [
  ghostListing,
  type2Listing,
  type3Listing,
];
