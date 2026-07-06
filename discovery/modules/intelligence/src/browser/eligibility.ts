export type BrowserEnrichCandidate = {
  crawlStatus: string | null;
  reachability: string | null;
  score: number;
  hasWebsite: boolean;
};

/** Surgical browser: blocked crawl + no reachability + high enough score. */
export function isBrowserEnrichEligible(
  candidate: BrowserEnrichCandidate,
  minScore: number,
): boolean {
  return (
    candidate.hasWebsite &&
    candidate.crawlStatus === 'blocked' &&
    candidate.reachability === 'none' &&
    candidate.score >= minScore
  );
}
