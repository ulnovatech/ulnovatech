/** Whole calendar months between two dates (floor). */
export function monthsBetween(earlier: Date, later: Date): number {
  const start = new Date(Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate()));
  const end = new Date(Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate()));
  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  months += end.getUTCMonth() - start.getUTCMonth();
  if (end.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}
