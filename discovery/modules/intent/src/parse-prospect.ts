import { createHash } from 'crypto';

export type CreateProspectInput = {
  name?: string;
  city?: string;
  country?: string;
  industry?: string;
  website?: string;
};

export type SignalTextInput = {
  title?: string | null;
  snippet?: string | null;
};

export function hashSourceUrl(sourceUrl: string): string {
  return createHash('sha256').update(sourceUrl.trim().toLowerCase()).digest('hex').slice(0, 32);
}

function extractNameFromText(text?: string | null): string | null {
  if (!text?.trim()) return null;
  const cleaned = text
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^(hiring|help wanted|looking for|seeking)\s*:?\s*/i, '')
    .trim();
  const firstLine = cleaned.split(/\r?\n/)[0]?.trim() ?? '';
  if (firstLine.length < 3) return null;
  return firstLine.slice(0, 200);
}

export function parseProspectFromSignal(
  signal: SignalTextInput,
  input: CreateProspectInput = {},
): Required<Pick<CreateProspectInput, 'name'>> & CreateProspectInput {
  const name =
    input.name?.trim() ||
    extractNameFromText(signal.title) ||
    extractNameFromText(signal.snippet) ||
    'Unknown prospect';

  return {
    name,
    city: input.city?.trim() || undefined,
    country: input.country?.trim() || undefined,
    industry: input.industry?.trim() || undefined,
    website: input.website?.trim() || undefined,
  };
}
