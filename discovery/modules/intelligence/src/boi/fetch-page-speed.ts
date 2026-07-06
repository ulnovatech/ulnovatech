import { logger } from '@agency/config';
import { hasRealWebsite } from '@agency/scoring';
import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoIPageSpeedSnapshot } from './types';

const PAGESPEED_TIMEOUT_MS = 20_000;

function pageSpeedApiKey(): string | undefined {
  return process.env.GOOGLE_PAGESPEED_KEY?.trim() || undefined;
}

function resolveWebsiteUrl(profile: BusinessIntelligenceProfile): string | null {
  const fromBio = profile.digitalFootprint.linkInBioPages.find((p) => p.resolvedWebsite)?.resolvedWebsite;
  const website = profile.contact.website ?? fromBio ?? null;
  const real = hasRealWebsite({
    hasWebsite: profile.presence.hasWebsite,
    website,
    resolvedWebsiteFromBio: fromBio,
  });
  if (!real || !website?.trim()) return null;

  const trimmed = website.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Fetch mobile PageSpeed performance score when GOOGLE_PAGESPEED_KEY is configured.
 * Returns null when key missing, no website, or API failure — never throws.
 */
export async function fetchPageSpeedIfConfigured(
  profile: BusinessIntelligenceProfile,
  deps: { fetchFn?: typeof fetch } = {},
): Promise<BoIPageSpeedSnapshot | null> {
  const apiKey = pageSpeedApiKey();
  if (!apiKey) return null;

  const url = resolveWebsiteUrl(profile);
  if (!url) return null;

  const fetchFn = deps.fetchFn ?? fetch;
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.set('category', 'performance');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS);

  try {
    const res = await fetchFn(endpoint.toString(), { signal: controller.signal });
    if (!res.ok) {
      logger.warn('PageSpeed API request failed', {
        businessId: profile.businessId,
        status: res.status,
      });
      return null;
    }

    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number | null } };
      };
    };

    const raw = data.lighthouseResult?.categories?.performance?.score;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return null;

    const performanceScore = Math.round(raw * 100);
    if (performanceScore < 0 || performanceScore > 100) return null;

    return {
      performanceScore,
      strategy: 'mobile',
      capturedAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.warn('PageSpeed fetch failed', {
      businessId: profile.businessId,
      error: String(err),
    });
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
