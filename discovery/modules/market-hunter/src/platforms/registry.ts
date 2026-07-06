import { platformSettings } from '@agency/settings';
import type { MarketHunterPlatformKey } from '../types';
import type { MarketHunterSettings } from '@agency/settings';
import type { PlatformAdapter } from './base.adapter';
import { getPlatformConfig, PLATFORM_CONFIG, type PlatformConfigEntry } from './platform-config';

const adapters = new Map<MarketHunterPlatformKey, PlatformAdapter>();

/** Register a live adapter implementation (Chunk 3+). */
export function registerPlatformAdapter(adapter: PlatformAdapter): void {
  adapters.set(adapter.platformKey, adapter);
}

export function getRegisteredAdapter(key: MarketHunterPlatformKey): PlatformAdapter | null {
  return adapters.get(key) ?? null;
}

export function isAdapterRegistered(key: MarketHunterPlatformKey): boolean {
  return adapters.has(key);
}

export function listRegisteredAdapterKeys(): MarketHunterPlatformKey[] {
  return [...adapters.keys()];
}

function resolveSettings(settings?: MarketHunterSettings) {
  return settings ?? platformSettings.getSync().marketHunter;
}

/** Resolve categories: settings override → built-in defaults. */
export function resolvePlatformCategories(
  key: MarketHunterPlatformKey,
  settings?: MarketHunterSettings,
): string[] {
  const mh = resolveSettings(settings);
  const override = mh.platformCategories?.[key];
  if (override?.length) {
    return override.map((c) => c.trim()).filter(Boolean);
  }
  return PLATFORM_CONFIG[key].categories;
}

/** Platform config with operator category overrides applied. */
export function getResolvedPlatformConfig(
  key: MarketHunterPlatformKey,
  settings?: MarketHunterSettings,
): PlatformConfigEntry {
  const base = PLATFORM_CONFIG[key];
  return {
    ...base,
    categories: resolvePlatformCategories(key, settings),
  };
}

/** Platform configs enabled in operator settings. */
export function getEnabledPlatformConfigs(
  settings?: MarketHunterSettings,
): PlatformConfigEntry[] {
  const toggles = resolveSettings(settings).platforms;
  return (Object.keys(PLATFORM_CONFIG) as MarketHunterPlatformKey[])
    .filter((key) => toggles[key])
    .map((key) => getResolvedPlatformConfig(key, settings));
}

/** Marketplace platforms enabled for Type 2/3 gap scoring. */
export function getGapScoringPlatformConfigs(
  settings?: MarketHunterSettings,
): PlatformConfigEntry[] {
  return getEnabledPlatformConfigs(settings).filter((c) => c.supportsGapScoring);
}

/** Flat scan targets: one row per enabled platform × category. */
export function listScanTargets(settings?: MarketHunterSettings): Array<{
  platform: MarketHunterPlatformKey;
  category: string;
  config: PlatformConfigEntry;
}> {
  const targets: Array<{
    platform: MarketHunterPlatformKey;
    category: string;
    config: PlatformConfigEntry;
  }> = [];

  for (const config of getEnabledPlatformConfigs(settings)) {
    for (const category of config.categories) {
      targets.push({ platform: config.key, category, config });
    }
  }

  return targets;
}

/** Enabled platforms that have a registered adapter ready for live calls. */
export function getEnabledAdapters(settings?: MarketHunterSettings): PlatformAdapter[] {
  const enabled = getEnabledPlatformConfigs(settings).map((c) => c.key);
  return enabled
    .map((key) => adapters.get(key))
    .filter((a): a is PlatformAdapter => a != null);
}

export function getAdapterForPlatform(key: MarketHunterPlatformKey): PlatformAdapter | null {
  return adapters.get(key) ?? null;
}
