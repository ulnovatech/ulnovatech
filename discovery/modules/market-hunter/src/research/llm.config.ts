import { platformSettings } from '@agency/settings';
import type {
  MarketHunterComplaintsProvider,
  MarketHunterCostEstimates,
  MarketHunterLlmSettings,
  MarketHunterResearchProvider,
} from '@agency/settings';

export const DEFAULT_COST_ESTIMATES: MarketHunterCostEstimates = {
  researchListingCallUsd: 0.002,
  researchReviewsCallUsd: 0.001,
  complaintAnalysisCallUsd: 0.003,
};

export function getMarketHunterLlmSettings(): MarketHunterLlmSettings {
  return platformSettings.getSync().marketHunter.llm;
}

export function getResearchProvider(): MarketHunterResearchProvider {
  return getMarketHunterLlmSettings().researchProvider;
}

export function getComplaintsProvider(): MarketHunterComplaintsProvider {
  return getMarketHunterLlmSettings().complaintsProvider;
}

export function getResearchModel(): string {
  const llm = getMarketHunterLlmSettings();
  if (llm.researchModel.trim()) return llm.researchModel.trim();
  return llm.researchProvider === 'openrouter' ? 'perplexity/sonar' : 'grok-3';
}

export function getComplaintsModel(): string {
  const llm = getMarketHunterLlmSettings();
  if (llm.complaintsModel.trim()) return llm.complaintsModel.trim();
  return llm.complaintsProvider === 'openrouter'
    ? 'anthropic/claude-sonnet-4'
    : 'claude-sonnet-4-20250514';
}

export function resolveResearchApiKey(): string | undefined {
  const provider = getResearchProvider();
  if (provider === 'openrouter') {
    return platformSettings.getCredential('openrouter_api_key');
  }
  return platformSettings.getCredential('xai_grok_api_key');
}

export function resolveComplaintsApiKey(): string | undefined {
  const provider = getComplaintsProvider();
  if (provider === 'openrouter') {
    return platformSettings.getCredential('openrouter_api_key');
  }
  return platformSettings.getCredential('anthropic_api_key');
}

export function getCostEstimates(): MarketHunterCostEstimates {
  const fromSettings = platformSettings.getSync().marketHunter.costEstimates;
  return {
    researchListingCallUsd:
      fromSettings.researchListingCallUsd ?? DEFAULT_COST_ESTIMATES.researchListingCallUsd,
    researchReviewsCallUsd:
      fromSettings.researchReviewsCallUsd ?? DEFAULT_COST_ESTIMATES.researchReviewsCallUsd,
    complaintAnalysisCallUsd:
      fromSettings.complaintAnalysisCallUsd ?? DEFAULT_COST_ESTIMATES.complaintAnalysisCallUsd,
  };
}

export function getPaymentPath(): string {
  const path = platformSettings.getSync().marketHunter.paymentPath?.trim();
  return path || 'Payoneer → Binance P2P → MTN/Airtel Mobile Money';
}
