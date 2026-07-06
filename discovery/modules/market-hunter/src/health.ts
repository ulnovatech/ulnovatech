import { platformSettings } from '@agency/settings';
import { PLATFORM_LABELS } from './platform-keys';
import { isAdapterRegistered } from './platforms/registry';
import {
  getComplaintsProvider,
  getResearchProvider,
  resolveComplaintsApiKey,
  resolveResearchApiKey,
} from './research/llm.config';
import {
  MARKET_HUNTER_PLATFORMS,
  type MarketHunterCredentialHealth,
  type MarketHunterHealth,
  type MarketHunterPlatformHealth,
} from './types';

function credentialHealth(
  key: MarketHunterCredentialHealth['key'],
  label: string,
  requiredFor: MarketHunterCredentialHealth['requiredFor'],
): MarketHunterCredentialHealth {
  const statuses = platformSettings.getCredentialStatuses();
  const found = statuses.find((s) => s.key === key);
  return {
    key,
    label,
    configured: found?.configured ?? false,
    source: found?.source ?? 'none',
    requiredFor,
  };
}

export async function getMarketHunterHealth(): Promise<MarketHunterHealth> {
  await platformSettings.ensureLoaded();
  const settings = platformSettings.getSync();
  const mh = settings.marketHunter;
  const { researchProvider, complaintsProvider, researchModel, complaintsModel } = mh.llm;

  const credentials: MarketHunterCredentialHealth[] = [
    credentialHealth(
      'openrouter_api_key',
      'OpenRouter API Key',
      researchProvider === 'openrouter' || complaintsProvider === 'openrouter'
        ? 'research'
        : 'optional',
    ),
    credentialHealth(
      'xai_grok_api_key',
      'xAI Grok API Key (direct)',
      researchProvider === 'xai' ? 'research' : 'optional',
    ),
    credentialHealth(
      'anthropic_api_key',
      'Anthropic API Key (direct)',
      complaintsProvider === 'anthropic' ? 'complaints' : 'optional',
    ),
  ];

  const platforms: MarketHunterPlatformHealth[] = MARKET_HUNTER_PLATFORMS.map((key) => ({
    key,
    label: PLATFORM_LABELS[key],
    enabled: mh.platforms[key] ?? false,
    configured: isAdapterRegistered(key),
    adapterReady: isAdapterRegistered(key),
  }));

  const researchOk = !!resolveResearchApiKey();
  const complaintsOk = !!resolveComplaintsApiKey();
  const anyPlatformEnabled = platforms.some((p) => p.enabled);
  const anyAdapterReady = platforms.some((p) => p.enabled && p.adapterReady);

  const ready = mh.enabled && researchOk && anyPlatformEnabled && anyAdapterReady;
  let message: string | undefined;

  if (!mh.enabled) {
    message = 'Market Hunter is disabled in Settings.';
  } else if (!researchOk) {
    message =
      researchProvider === 'openrouter'
        ? 'Configure OpenRouter API key in Hunter settings to run marketplace research.'
        : 'Configure xAI Grok API key in Hunter settings to run marketplace research.';
  } else if (!anyPlatformEnabled) {
    message = 'Enable at least one marketplace platform in Settings.';
  } else if (!anyAdapterReady) {
    message =
      'Platforms are enabled but no live adapters are registered yet. Ensure market-hunter bootstrap loaded.';
  } else if (!complaintsOk) {
    message = `Ready to scan listings via ${researchProvider} (${researchModel}). Complaint extraction needs a ${complaintsProvider === 'openrouter' ? 'OpenRouter' : 'Anthropic'} key for full gap cards.`;
  } else {
    message = `Ready — research: ${researchProvider} (${researchModel}), complaints: ${complaintsProvider} (${complaintsModel}).`;
  }

  return {
    product: 'Live Market Hunter',
    enabled: mh.enabled,
    ready,
    message,
    settings: {
      maxSpendPerRunUsd: mh.maxSpendPerRunUsd,
      defaultListingLimit: mh.defaultListingLimit,
      scheduleCron: mh.scheduleCron,
      researchProvider: mh.llm.researchProvider,
      researchModel: mh.llm.researchModel,
      complaintsProvider: mh.llm.complaintsProvider,
      complaintsModel: mh.llm.complaintsModel,
    },
    credentials,
    platforms,
  };
}
