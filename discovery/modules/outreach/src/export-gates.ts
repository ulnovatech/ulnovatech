export const DEFAULT_EXPORT_STATUSES = ['REVIEWED', 'CONTACTED'] as const;

export function resolveExportStatuses(includeUnreviewed: boolean): string[] {
  if (includeUnreviewed) {
    return ['NEW', ...DEFAULT_EXPORT_STATUSES];
  }
  return [...DEFAULT_EXPORT_STATUSES];
}

export function hasContactPath(email?: string | null, phone?: string | null): boolean {
  return !!(email?.trim() || phone?.trim());
}
