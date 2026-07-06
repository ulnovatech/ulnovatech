import { PLATFORM_CONFIG } from './platforms/platform-config';
import type { MarketHunterPlatformKey } from './types';

export const PLATFORM_LABELS: Record<MarketHunterPlatformKey, string> = Object.fromEntries(
  Object.values(PLATFORM_CONFIG).map((c) => [c.key, c.label]),
) as Record<MarketHunterPlatformKey, string>;
