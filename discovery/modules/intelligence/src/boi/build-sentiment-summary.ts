import type { BusinessIntelligenceProfile } from '../bi/types';
import type { BoISentimentSummary, BoISentimentTheme } from './types';

type ThemePattern = {
  id: string;
  label: string;
  match: RegExp;
  baseConfidence: number;
};

const PRAISE_PATTERNS: ThemePattern[] = [
  {
    id: 'service_quality',
    label: 'Praise for service quality',
    match: /\b(great service|excellent service|amazing service|wonderful service|top[- ]notch)\b/i,
    baseConfidence: 72,
  },
  {
    id: 'staff_friendliness',
    label: 'Friendly / professional staff',
    match: /\b(friendly staff|professional staff|helpful staff|kind staff|great team)\b/i,
    baseConfidence: 68,
  },
  {
    id: 'overall_experience',
    label: 'Positive overall experience',
    match: /\b(highly recommend|love this place|best in town|will return|five stars?)\b/i,
    baseConfidence: 70,
  },
  {
    id: 'value_praise',
    label: 'Good value for money',
    match: /\b(great value|worth (every|the) (penny|shilling)|affordable and good)\b/i,
    baseConfidence: 62,
  },
];

const COMPLAINT_PATTERNS: ThemePattern[] = [
  {
    id: 'slow_service',
    label: 'Slow service or long waits',
    match: /\b(slow service|long wait|waited (too )?long|took forever)\b/i,
    baseConfidence: 70,
  },
  {
    id: 'poor_communication',
    label: 'Hard to reach or poor communication',
    match: /\b(no response|never answered|hard to contact|poor communication|ignored)\b/i,
    baseConfidence: 68,
  },
  {
    id: 'pricing_concern',
    label: 'Pricing concerns',
    match: /\b(overpriced|too expensive|not worth|rip[- ]?off|hidden fees)\b/i,
    baseConfidence: 65,
  },
  {
    id: 'quality_issue',
    label: 'Quality or experience disappointment',
    match: /\b(disappointed|terrible|worst|never again|unprofessional|rude)\b/i,
    baseConfidence: 72,
  },
];

function excerptAround(text: string, match: RegExp, maxLen = 160): string {
  const m = match.exec(text);
  if (!m || m.index == null) return text.slice(0, maxLen);
  const start = Math.max(0, m.index - 50);
  const end = Math.min(text.length, m.index + m[0].length + 50);
  const slice = text.slice(start, end).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${slice}${suffix}`.slice(0, maxLen);
}

function mineThemes(
  snippets: Array<{ text: string; rating?: number | null }>,
  patterns: ThemePattern[],
  kind: BoISentimentTheme['kind'],
): BoISentimentTheme[] {
  const counts = new Map<string, { pattern: ThemePattern; excerpts: string[]; ratings: number[] }>();

  for (const snippet of snippets) {
    const text = snippet.text.trim();
    if (!text) continue;

    for (const pattern of patterns) {
      if (!pattern.match.test(text)) continue;
      const row = counts.get(pattern.id) ?? { pattern, excerpts: [], ratings: [] };
      row.excerpts.push(excerptAround(text, pattern.match));
      if (typeof snippet.rating === 'number') row.ratings.push(snippet.rating);
      counts.set(pattern.id, row);
    }

    if (kind === 'praise' && typeof snippet.rating === 'number' && snippet.rating >= 4 && text.length >= 20) {
      const id = 'high_rating_review';
      const row = counts.get(id) ?? {
        pattern: {
          id,
          label: 'High-rated review',
          match: /.*/,
          baseConfidence: 55,
        },
        excerpts: [],
        ratings: [],
      };
      if (!row.excerpts.includes(text.slice(0, 160))) {
        row.excerpts.push(text.slice(0, 160));
        row.ratings.push(snippet.rating);
        counts.set(id, row);
      }
    }

    if (kind === 'complaint' && typeof snippet.rating === 'number' && snippet.rating <= 2 && text.length >= 20) {
      const id = 'low_rating_review';
      const row = counts.get(id) ?? {
        pattern: {
          id,
          label: 'Low-rated review',
          match: /.*/,
          baseConfidence: 60,
        },
        excerpts: [],
        ratings: [],
      };
      if (!row.excerpts.includes(text.slice(0, 160))) {
        row.excerpts.push(text.slice(0, 160));
        row.ratings.push(snippet.rating);
        counts.set(id, row);
      }
    }
  }

  return [...counts.values()]
    .map(({ pattern, excerpts, ratings }) => {
      const mentionCount = excerpts.length;
      const ratingBoost =
        kind === 'praise'
          ? ratings.filter((r) => r >= 4).length > 0
            ? 8
            : 0
          : ratings.filter((r) => r <= 2).length > 0
            ? 10
            : 0;
      const confidence = Math.min(95, pattern.baseConfidence + Math.min(mentionCount * 4, 16) + ratingBoost);
      return {
        id: pattern.id,
        kind,
        label: pattern.label,
        mentionCount,
        confidence,
        sampleExcerpt: excerpts[0] ?? null,
      };
    })
    .sort((a, b) => b.mentionCount - a.mentionCount || b.confidence - a.confidence)
    .slice(0, 4);
}

/**
 * Praise and complaint themes from Google Places review snippets on the BI profile.
 * Returns null when no review text is available.
 */
export function buildSentimentSummary(profile: BusinessIntelligenceProfile): BoISentimentSummary | null {
  const snippets = profile.businessSignals.reviewSnippets;
  if (snippets.length === 0) return null;

  const praiseThemes = mineThemes(snippets, PRAISE_PATTERNS, 'praise');
  const complaintThemes = mineThemes(snippets, COMPLAINT_PATTERNS, 'complaint');

  if (praiseThemes.length === 0 && complaintThemes.length === 0) return null;

  const reviewCount =
    typeof profile.presence.reviewCount === 'number' && profile.presence.reviewCount > 0
      ? profile.presence.reviewCount
      : snippets.length;

  return {
    overallRating: profile.presence.rating ?? null,
    reviewCount,
    praiseThemes,
    complaintThemes,
    synthesizedAt: new Date().toISOString(),
  };
}
