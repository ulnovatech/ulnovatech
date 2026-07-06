import type { MarketHunterPlatformKey } from '../types';
import type { PlatformMechanics } from '../platforms/base.adapter';
import type { VisibilityVerdict } from './types';

export function checkVisibility(
  _platform: MarketHunterPlatformKey | string,
  mechanics: PlatformMechanics,
  categoryListingCount: number,
): VisibilityVerdict {
  if (!mechanics.hasNewListingBoost && !mechanics.keywordsAffectRanking) {
    return {
      willSurface: false,
      risk: 'HIGH',
      recommendation:
        'Platform provides zero organic discovery for new listings. Requires external traffic. Skip unless you have an audience.',
      exploitableWindow: null,
    };
  }

  if (categoryListingCount > 1000 && mechanics.hasNewListingBoost) {
    return {
      willSurface: true,
      risk: 'MEDIUM',
      recommendation: `New listing boost exists but ${categoryListingCount} competitors means keyword precision is critical. Tags must match exact buyer search terms.`,
      exploitableWindow: `${mechanics.newListingBoostDurationDays} day new listing window`,
    };
  }

  if (mechanics.hasNewListingBoost && categoryListingCount < 500) {
    return {
      willSurface: true,
      risk: 'LOW',
      recommendation:
        'Platform will surface new listing automatically. Optimise tags before publishing.',
      exploitableWindow: `${mechanics.newListingBoostDurationDays} day new listing window — maximise early sales velocity during this window`,
    };
  }

  return {
    willSurface: true,
    risk: 'MEDIUM',
    recommendation: 'Moderate discovery conditions. Keyword optimisation required.',
    exploitableWindow: null,
  };
}

export function isEligibleForActionCard(
  gapType: 'TYPE_2' | 'TYPE_3' | 'NONE',
  visibility: VisibilityVerdict,
): boolean {
  return gapType !== 'NONE' && visibility.risk !== 'HIGH';
}
