/** Tier 5 custom scrape — off unless explicitly enabled. */
export function isCustomScrapeEnabled(): boolean {
  return process.env.CUSTOM_SCRAPE_ENABLED === 'true';
}

/** Max 1 request per 5 seconds across custom scrape providers. */
export const CUSTOM_SCRAPE_MIN_INTERVAL_MS = 5_000;
