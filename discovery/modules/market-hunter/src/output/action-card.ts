import type { MarketplaceListing } from '../platforms/base.adapter';
import type { ComplaintAnalysis, GapScore, VisibilityVerdict } from '../scoring/types';
import type { MarketHunterPlatformKey } from '../types';

export type ActionCardConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type ActionCard = {
  rank: number;
  gapScore: number;
  confidence: ActionCardConfidence;
  platform: MarketHunterPlatformKey;
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

function confidenceFromScore(score: number): ActionCardConfidence {
  if (score > 70) return 'HIGH';
  if (score > 40) return 'MEDIUM';
  return 'LOW';
}

export function generateActionCard(input: {
  listing: MarketplaceListing;
  gapScore: GapScore;
  complaints: ComplaintAnalysis;
  visibility: VisibilityVerdict;
  platform: MarketHunterPlatformKey;
  rank: number;
  listingKey: string;
  paymentPath?: string;
}): ActionCard {
  if (input.gapScore.type === 'NONE') {
    throw new Error('generateActionCard requires TYPE_2 or TYPE_3 gap score');
  }

  const differentiators =
    input.gapScore.type === 'TYPE_2'
      ? input.complaints.buildableFixes
      : [`Modern rebuild of stale ${input.listing.category} product`];

  return {
    rank: input.rank,
    gapScore: input.gapScore.score,
    confidence: confidenceFromScore(input.gapScore.score),
    platform: input.platform,
    originalProduct: input.listing.title,
    originalUrl: input.listing.url,
    originalPrice: input.listing.price,
    originalSales: input.listing.salesCount,
    gapType: input.gapScore.type,
    buildSpec: {
      coreScope: `Rebuild of "${input.listing.title}" with ${input.gapScore.type === 'TYPE_2' ? 'documented buyer fixes' : 'updated stack and UX'}`,
      differentiators,
      estimatedBuildDays:
        input.gapScore.type === 'TYPE_2'
          ? Math.max(1, input.complaints.estimatedFixTimeDays)
          : Math.max(7, Math.round(input.gapScore.staleness * 0.5)),
      recommendedPrice: input.listing.price,
    },
    visibilityPlan: {
      exploitableWindow: input.visibility.exploitableWindow ?? 'No automatic window',
      keywordSuggestions: input.listing.tags,
      risk: input.visibility.risk,
      recommendation: input.visibility.recommendation,
    },
    paymentPath: input.paymentPath ?? 'Payoneer → Binance P2P → MTN/Airtel Mobile Money',
    approvedForBuild: false,
    listingKey: input.listingKey,
  };
}

export function sortActionCards(cards: ActionCard[]): ActionCard[] {
  return [...cards].sort((a, b) => b.gapScore - a.gapScore || a.rank - b.rank);
}

export function rerankActionCards(cards: ActionCard[]): ActionCard[] {
  const sorted = sortActionCards(cards);
  return sorted.map((card, index) => ({ ...card, rank: index + 1 }));
}
