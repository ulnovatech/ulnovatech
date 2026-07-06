import { platformSettings, type AcquisitionMode } from '@agency/settings';

export type { AcquisitionMode };
export type RunProfile = 'micro' | 'standard' | 'boost';

export async function ensureDiscoverySettings() {
  return platformSettings.ensureLoaded();
}

export function getAcquisitionMode(): AcquisitionMode {
  return platformSettings.getAcquisitionMode();
}

export function profileToMode(profile: RunProfile): AcquisitionMode {
  if (profile === 'micro') return 'economy';
  if (profile === 'boost') return 'boost';
  return 'standard';
}

export function modeToProfile(mode: AcquisitionMode): RunProfile {
  if (mode === 'economy') return 'micro';
  if (mode === 'boost') return 'boost';
  return 'standard';
}

export function getRunSearchQueryLimit(mode = getAcquisitionMode()): number {
  return platformSettings.getRunSearchQueryLimit(mode);
}

/** CSE/Bing result pages fetched per query (10 results per page). */
export function getSearchPagesPerQuery(mode = getAcquisitionMode()): number {
  if (mode === 'economy') return 1;
  if (mode === 'boost') return 3;
  return 2;
}

export function getMetaGraphQueryLimit(mode = getAcquisitionMode()): number {
  return platformSettings.getMetaGraphQueryLimit(mode);
}

/** Graph API result pages fetched per query (page + place searches). */
export function getMetaGraphPagesPerQuery(mode = getAcquisitionMode()): number {
  if (mode === 'economy') return 1;
  if (mode === 'boost') return 2;
  return 1;
}

export function getSocialSearchQueryLimit(mode = getAcquisitionMode()): number {
  return platformSettings.getSocialSearchQueryLimit(mode);
}

export function googleMapsEnabledInMode(mode = getAcquisitionMode()): boolean {
  return platformSettings.googleMapsEnabledInMode(mode);
}

export function getRunProfileLabel(profile: RunProfile): string {
  const labels: Record<RunProfile, string> = {
    micro: 'Micro (0 Places, search-first)',
    standard: 'Standard (Places primary + verify)',
    boost: 'Boost (higher Places caps)',
  };
  return labels[profile];
}
