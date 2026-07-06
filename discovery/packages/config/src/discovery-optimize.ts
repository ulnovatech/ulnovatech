/** Stop Places discovery once we have enough unique candidates. */
export function discoveryTargetCandidates(): number {
  const raw = process.env.DISCOVERY_TARGET_CANDIDATES?.trim();
  const n = raw ? parseInt(raw, 10) : 40;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 200) : 40;
}

/** Max city queries when "All cities" is selected (standard profile). */
export function allCitiesMaxQueriesStandard(): number {
  const raw = process.env.ALL_CITIES_MAX_QUERIES_STANDARD?.trim();
  const n = raw ? parseInt(raw, 10) : 5;
  return Number.isFinite(n) && n > 0 ? n : 5;
}

/** Max city queries when "All cities" is selected (boost profile). */
export function allCitiesMaxQueriesBoost(): number {
  const raw = process.env.ALL_CITIES_MAX_QUERIES_BOOST?.trim();
  const n = raw ? parseInt(raw, 10) : 10;
  return Number.isFinite(n) && n > 0 ? n : 10;
}

/** Parallel Places text-search queries (city-level). */
export function placesQueryConcurrency(): number {
  const raw = process.env.PLACES_QUERY_CONCURRENCY?.trim();
  const n = raw ? parseInt(raw, 10) : 3;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 6) : 3;
}

/** Parallel public/social search queries per discover pass. */
export function publicSearchQueryConcurrency(): number {
  const raw = process.env.PUBLIC_SEARCH_QUERY_CONCURRENCY?.trim();
  const n = raw ? parseInt(raw, 10) : 3;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 8) : 3;
}

/** Share of public search query budget for prospect/ICP templates (0–1). */
export function prospectQueryRatio(): number {
  const raw = process.env.PROSPECT_QUERY_RATIO?.trim();
  const n = raw ? parseFloat(raw) : 0.4;
  if (!Number.isFinite(n)) return 0.4;
  return Math.min(0.85, Math.max(0.1, n));
}

/** Prospect query share when run has prospect focus enabled (0–1). */
export function prospectFocusQueryRatio(): number {
  const raw = process.env.PROSPECT_FOCUS_QUERY_RATIO?.trim();
  const n = raw ? parseFloat(raw) : 0.65;
  if (!Number.isFinite(n)) return 0.65;
  return Math.min(0.9, Math.max(0.4, n));
}

/** Inline dev pipeline: max stages to process per resume call. */
export function inlinePipelineMaxSteps(): number {
  const raw = process.env.INLINE_PIPELINE_MAX_STEPS?.trim();
  const n = raw ? parseInt(raw, 10) : 8;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 8;
}
