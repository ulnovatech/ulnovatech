export interface NormalizeInput {
  name: string;
  source: string;
  externalId?: string | null;
  city?: string | null;
  country?: string | null;
}

export function buildNormalizedKey(input: NormalizeInput): string {
  const externalId = input.externalId?.trim();
  if (externalId) {
    return `ext:${input.source}:${externalId}`;
  }

  const name = input.name.trim().toLowerCase();
  const city = (input.city ?? '').trim().toLowerCase();
  const country = (input.country ?? '').trim().toLowerCase();
  const source = input.source.trim().toLowerCase();
  return `key:${name}|${city}|${country}|${source}`;
}
