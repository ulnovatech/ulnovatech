/** Deduplicate business IDs for targeted post-enrich pipeline updates. */
export function uniqueBusinessIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => typeof id === 'string' && id.trim().length > 0))];
}
