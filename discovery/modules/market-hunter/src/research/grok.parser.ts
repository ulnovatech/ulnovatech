import type { MarketHunterPlatformKey } from '../types';
import type { MarketplaceListing } from '../platforms/base.adapter';
import type { RawGrokListing } from './grok.types';

export class GrokParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GrokParseError';
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

function asString(v: unknown, field: string): string {
  if (typeof v !== 'string' || !v.trim()) {
    throw new GrokParseError(`missing or invalid ${field}`);
  }
  return v.trim();
}

function asNumber(v: unknown, field: string): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) {
    throw new GrokParseError(`missing or invalid ${field}`);
  }
  return n;
}

function asStringArray(v: unknown, field: string): string[] {
  if (!Array.isArray(v)) {
    throw new GrokParseError(`missing or invalid ${field}`);
  }
  return v.map((item, i) => {
    if (typeof item !== 'string') {
      throw new GrokParseError(`invalid ${field}[${i}]`);
    }
    return item.trim();
  }).filter(Boolean);
}

function asOptionalStringArray(v: unknown): string[] {
  if (v == null) return [];
  return asStringArray(v, 'topComplaints');
}

function parseDateField(value: string, field: string): Date {
  if (!ISO_DATE.test(value)) {
    throw new GrokParseError(`invalid ${field} date (expected YYYY-MM-DD)`);
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new GrokParseError(`invalid ${field} date`);
  }
  return d;
}

/** Strip markdown fences and parse JSON from Grok text output. */
export function parseGrokJsonContent(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new GrokParseError('empty Grok content');
  }

  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    const arrayStart = withoutFences.indexOf('[');
    const arrayEnd = withoutFences.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(withoutFences.slice(arrayStart, arrayEnd + 1));
      } catch {
        // fall through
      }
    }
    throw new GrokParseError('Grok content is not valid JSON');
  }
}

export function validateGrokListing(raw: unknown): RawGrokListing {
  if (!isRecord(raw)) {
    throw new GrokParseError('listing must be an object');
  }

  const lastUpdated = asString(raw.lastUpdated, 'lastUpdated');
  const publishedDate = asString(raw.publishedDate, 'publishedDate');
  parseDateField(lastUpdated, 'lastUpdated');
  parseDateField(publishedDate, 'publishedDate');

  return {
    title: asString(raw.title, 'title'),
    price: asNumber(raw.price, 'price'),
    salesCount: asNumber(raw.salesCount, 'salesCount'),
    lastUpdated,
    publishedDate,
    tags: asStringArray(raw.tags, 'tags'),
    reviewCount: asNumber(raw.reviewCount, 'reviewCount'),
    averageRating: asNumber(raw.averageRating, 'averageRating'),
    url: asString(raw.url, 'url'),
    sellerName: typeof raw.sellerName === 'string' ? raw.sellerName.trim() : undefined,
    topComplaints: asOptionalStringArray(raw.topComplaints),
  };
}

export function validateGrokListingsPayload(data: unknown): RawGrokListing[] {
  if (!Array.isArray(data)) {
    throw new GrokParseError('expected JSON array of listings');
  }
  if (data.length === 0) {
    throw new GrokParseError('Grok returned zero listings');
  }
  return data.map((item, index) => {
    try {
      return validateGrokListing(item);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new GrokParseError(`listing[${index}]: ${msg}`);
    }
  });
}

export function validateGrokReviewTexts(data: unknown): string[] {
  let items: unknown[];
  if (Array.isArray(data)) {
    items = data;
  } else if (isRecord(data) && Array.isArray(data.reviews)) {
    items = data.reviews;
  } else {
    throw new GrokParseError('expected JSON array of review strings');
  }

  const reviews = items.map((item, i) => {
    if (typeof item !== 'string' || !item.trim()) {
      throw new GrokParseError(`review[${i}] must be a non-empty string`);
    }
    return item.trim();
  });

  if (reviews.length === 0) {
    throw new GrokParseError('Grok returned zero reviews');
  }

  return reviews;
}

function listingIdFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const item = segments[segments.length - 1];
    return item || url;
  } catch {
    return url;
  }
}

export function normalizeGrokListing(
  raw: RawGrokListing,
  platform: MarketHunterPlatformKey,
  category: string,
): MarketplaceListing {
  return {
    id: listingIdFromUrl(raw.url),
    platform,
    title: raw.title,
    price: raw.price,
    salesCount: raw.salesCount,
    lastUpdatedDate: parseDateField(raw.lastUpdated, 'lastUpdated'),
    publishedDate: parseDateField(raw.publishedDate, 'publishedDate'),
    tags: raw.tags,
    reviewCount: raw.reviewCount,
    averageRating: raw.averageRating,
    sellerName: raw.sellerName ?? 'unknown',
    category,
    url: raw.url,
    rawReviewText: raw.topComplaints,
  };
}

/** Extract assistant text from xAI Responses API or legacy chat completions body. */
export function extractGrokResponseText(data: unknown): string {
  if (!isRecord(data)) {
    throw new GrokParseError('empty Grok API response');
  }

  if (Array.isArray(data.output)) {
    const parts: string[] = [];
    for (const item of data.output) {
      if (!isRecord(item) || item.type !== 'message' || !Array.isArray(item.content)) {
        continue;
      }
      for (const block of item.content) {
        if (isRecord(block) && block.type === 'output_text' && typeof block.text === 'string') {
          parts.push(block.text);
        }
      }
    }
    const joined = parts.join('\n').trim();
    if (joined) return joined;
  }

  const choices = data.choices;
  if (Array.isArray(choices)) {
    const content = choices[0];
    if (isRecord(content) && isRecord(content.message) && typeof content.message.content === 'string') {
      const text = content.message.content.trim();
      if (text) return text;
    }
  }

  throw new GrokParseError('no text content in Grok API response');
}
