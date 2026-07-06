import { platformSettings } from '@agency/settings';

import { CsvImportProvider } from './csv-import';
import { getCsvImportFileInfo } from '../lib/csv-import-service';
import { PublicSearchProvider } from './public-search';
import { GooglePlacesDiscoveryProvider } from './places/places-discover';
import { GooglePlacesVerifyProvider } from './places/places-verify';
import { MetaGraphDiscoveryProvider } from './meta/meta-graph-provider';
import { SocialSearchProvider } from './social/social-search-provider';
import { getAcquisitionMode, googleMapsEnabledInMode } from '../lib/run-profile';
import type { DiscoveryProvider } from './types';

const placesDiscover = new GooglePlacesDiscoveryProvider();
const csvProvider = new CsvImportProvider();
const searchProvider = new PublicSearchProvider();
const metaProvider = new MetaGraphDiscoveryProvider();
const socialProvider = new SocialSearchProvider();
const placesVerify = new GooglePlacesVerifyProvider();

async function isProviderConfigured(provider: DiscoveryProvider): Promise<boolean> {
  return !!(await provider.isConfigured());
}

/**
 * Discover-stage providers in priority order:
 * 1. Google Places (standard/boost only)
 * 2. Public search
 * 3. Meta Graph (Facebook + Instagram)
 * 4. Social search (TikTok / LinkedIn / X / YouTube)
 * 5. CSV import
 */
export async function getConfiguredDiscoveryProviders(
  mode = getAcquisitionMode(),
): Promise<DiscoveryProvider[]> {
  await platformSettings.ensureLoaded();
  const ordered: DiscoveryProvider[] = [];

  if (googleMapsEnabledInMode(mode) && (await isProviderConfigured(placesDiscover))) {
    ordered.push(placesDiscover);
  }
  if (await isProviderConfigured(searchProvider)) ordered.push(searchProvider);
  if (await isProviderConfigured(metaProvider)) ordered.push(metaProvider);
  if (await isProviderConfigured(socialProvider)) ordered.push(socialProvider);
  if (await isProviderConfigured(csvProvider)) ordered.push(csvProvider);

  return ordered;
}

export async function getDiscoveryProviderStatus(): Promise<
  Array<{
    name: string;
    label: string;
    configured: boolean;
    enabled: boolean;
    reason?: string;
  }>
> {
  await platformSettings.ensureLoaded();

  const mode = getAcquisitionMode();
  const mapsAllowed = googleMapsEnabledInMode(mode);
  const placesConfigured = await placesVerify.isConfigured();

  const statuses = [];

  statuses.push({
    name: 'google_maps',
    label: placesDiscover.label,
    configured: placesConfigured,
    enabled: placesConfigured && mapsAllowed,
    reason:
      placesConfigured && !mapsAllowed
        ? `Disabled in ${mode} mode — use standard or boost for Places discovery`
        : placesConfigured && mapsAllowed
          ? 'Primary discovery + verify for search/CSV candidates'
          : undefined,
  });

  for (const p of [searchProvider, metaProvider, socialProvider]) {
    const configured = await isProviderConfigured(p);
    statuses.push({
      name: p.name,
      label: p.label,
      configured,
      enabled: configured,
      reason:
        p === metaProvider && configured
          ? 'Facebook page + place search; linked Instagram profiles when available'
          : p === socialProvider && configured
            ? 'TikTok, LinkedIn, X, YouTube via CSE/Bing site: queries (shares search budget)'
            : undefined,
    });
  }

  const csvInfo = getCsvImportFileInfo();
  statuses.push({
    name: csvProvider.name,
    label: csvProvider.label,
    configured: csvInfo.configured,
    enabled: csvInfo.configured,
    reason: !csvInfo.exists
      ? 'Upload a CSV file to enable import'
      : !csvInfo.valid
        ? csvInfo.validationMessage
        : `${csvInfo.rowCount} row${csvInfo.rowCount === 1 ? '' : 's'} ready`,
  });

  return statuses;
}

export function getAcquisitionModeLabel(): string {
  return getAcquisitionMode();
}

export { placesDiscover, placesVerify };
