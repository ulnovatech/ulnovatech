import { platformSettings } from '@agency/settings';
import type { DiscoverySearchParams } from '../providers/types';
import { locationPhrase } from './discovery-query-helpers';
import { expandIndustryTerms } from './industry-search-terms';

/**
 * Social platform `site:` queries for TikTok, LinkedIn, X, and YouTube.
 * Facebook/Instagram are handled by Meta Graph (P5-D9).
 */
export function buildSocialSearchQueries(
  params: DiscoverySearchParams,
  maxSocial = 5,
): string[] {
  const terms = expandIndustryTerms(params.industry, 2);
  const location = locationPhrase(params);
  const queries: string[] = [];

  for (const term of terms) {
    queries.push(`site:tiktok.com ${term} ${location}`);
    queries.push(`site:linkedin.com/company ${term} ${location}`);
    queries.push(`site:youtube.com ${term} ${location}`);
    queries.push(`site:twitter.com ${term} ${location}`);
    queries.push(`site:x.com ${term} ${location}`);
  }

  return [...new Set(queries)].slice(0, Math.max(0, maxSocial));
}
