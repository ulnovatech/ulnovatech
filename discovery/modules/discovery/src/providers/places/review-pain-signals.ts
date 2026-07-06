export type PlacesReviewRecord = {
  text?: string | null;
  rating?: number | null;
  publishTime?: string | null;
};

export type ReviewSnippet = {
  text: string;
  rating?: number | null;
  publishTime?: string | null;
  source: 'google_places';
};

export type ReviewPainMatch = {
  keyword: string;
  label: string;
  excerpt: string;
  reviewRating?: number | null;
  signalStrength: number;
};

export type BusinessSignalsFromReviews = {
  reviewSnippets: ReviewSnippet[];
  painKeywords: ReviewPainMatch[];
};

type PainPattern = {
  keyword: string;
  label: string;
  signalStrength: number;
  match: RegExp;
};

/** Agency-relevant pain cues in Google review text (case-insensitive). */
const PAIN_PATTERNS: PainPattern[] = [
  {
    keyword: 'no_website',
    label: 'Review mentions missing website',
    signalStrength: 65,
    match: /\b(no website|without a website|doesn'?t have a website|no web\s*site)\b/i,
  },
  {
    keyword: 'website',
    label: 'Review mentions website',
    signalStrength: 55,
    match: /\b(website|web\s*site|webpage|web page)\b/i,
  },
  {
    keyword: 'hard_to_book',
    label: 'Review mentions booking difficulty',
    signalStrength: 60,
    match: /\b(hard to book|difficult to book|couldn'?t book|can't book|booking (is )?a pain)\b/i,
  },
  {
    keyword: 'cant_find',
    label: 'Review mentions hard to find',
    signalStrength: 50,
    match: /\b(can'?t find|hard to find|difficult to find|couldn'?t find)\b/i,
  },
  {
    keyword: 'outdated',
    label: 'Review mentions outdated experience',
    signalStrength: 48,
    match: /\b(outdated|old website|needs updating|needs a refresh)\b/i,
  },
  {
    keyword: 'online_presence',
    label: 'Review mentions online presence',
    signalStrength: 45,
    match: /\b(online presence|not online|no online)\b/i,
  },
  {
    keyword: 'contact',
    label: 'Review mentions contact / reachability issues',
    signalStrength: 42,
    match: /\b(hard to contact|couldn'?t reach|no response|never answered)\b/i,
  },
];

const SNIPPET_MAX_LEN = 280;
const EXCERPT_RADIUS = 60;

function cleanReviewText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function excerptAroundMatch(text: string, match: RegExp): string {
  const m = match.exec(text);
  if (!m || m.index == null) return text.slice(0, SNIPPET_MAX_LEN);
  const start = Math.max(0, m.index - EXCERPT_RADIUS);
  const end = Math.min(text.length, m.index + m[0].length + EXCERPT_RADIUS);
  const slice = text.slice(start, end).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${slice}${suffix}`.slice(0, SNIPPET_MAX_LEN);
}

export function normalizePlacesReviews(raw: unknown): PlacesReviewRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: PlacesReviewRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as {
      text?: string | { text?: string } | null;
      rating?: number | null;
      publishTime?: string | null;
    };
    const rawText = row.text;
    const text =
      typeof rawText === 'string'
        ? rawText
        : rawText && typeof rawText === 'object' && typeof rawText.text === 'string'
          ? rawText.text
          : null;
    if (!text?.trim()) continue;
    out.push({
      text: cleanReviewText(text),
      rating: typeof row.rating === 'number' ? row.rating : null,
      publishTime: typeof row.publishTime === 'string' ? row.publishTime : null,
    });
  }
  return out;
}

export function readPlacesReviewsFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): PlacesReviewRecord[] {
  if (!metadata) return [];
  const fromReviews = normalizePlacesReviews(metadata.reviews);
  if (fromReviews.length > 0) return fromReviews;
  return normalizePlacesReviews(metadata.reviewSnippets);
}

export function extractReviewSnippets(
  reviews: PlacesReviewRecord[],
  maxSnippets = 5,
): ReviewSnippet[] {
  return reviews
    .filter((r) => r.text?.trim())
    .slice(0, maxSnippets)
    .map((r) => ({
      text: r.text!.slice(0, SNIPPET_MAX_LEN),
      rating: r.rating ?? null,
      publishTime: r.publishTime ?? null,
      source: 'google_places' as const,
    }));
}

export function mineReviewPainKeywords(
  snippets: ReviewSnippet[],
): ReviewPainMatch[] {
  const matches: ReviewPainMatch[] = [];
  const seen = new Set<string>();

  for (const snippet of snippets) {
    const text = snippet.text;
    for (const pattern of PAIN_PATTERNS) {
      if (!pattern.match.test(text)) continue;
      const key = `${pattern.keyword}:${snippet.text.slice(0, 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      matches.push({
        keyword: pattern.keyword,
        label: pattern.label,
        excerpt: excerptAroundMatch(text, pattern.match),
        reviewRating: snippet.rating ?? null,
        signalStrength: pattern.signalStrength,
      });
    }
  }

  return matches.sort((a, b) => b.signalStrength - a.signalStrength);
}

export function buildBusinessSignalsFromReviews(
  reviews: PlacesReviewRecord[],
): BusinessSignalsFromReviews {
  const reviewSnippets = extractReviewSnippets(reviews);
  return {
    reviewSnippets,
    painKeywords: mineReviewPainKeywords(reviewSnippets),
  };
}

export function reviewPainSourceUrl(businessId: string, keyword: string): string {
  return `places_review_pain:${businessId}:${keyword}`;
}
