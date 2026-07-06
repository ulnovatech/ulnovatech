import type { BoIEvidence, BoIStructuredPain } from './types';

export type BuildOutreachOpenerInput = {
  businessName: string;
  city?: string | null;
  industry?: string | null;
  pains: BoIStructuredPain[];
  evidence: BoIEvidence[];
  pitchAngle?: string | null;
  topService?: string | null;
};

export type OutreachOpenerResult = {
  opener: string | null;
  evidenceIds: string[];
  painId: string | null;
  painLabel: string | null;
};

function trimExcerpt(excerpt: string, max = 120): string {
  const cleaned = excerpt.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

function painClause(label: string): string {
  const lower = label.trim().toLowerCase();
  if (lower.startsWith('customers')) return lower;
  return `customers are experiencing ${lower.replace(/\.$/, '')}`;
}

/**
 * Rules-first 2–3 sentence outreach opener from top BOI pain and cited evidence.
 * Returns null when no pains exist — never fabricates personalization.
 */
export function buildOutreachOpener(input: BuildOutreachOpenerInput): OutreachOpenerResult {
  const topPain = input.pains[0];
  if (!topPain) {
    return { opener: null, evidenceIds: [], painId: null, painLabel: null };
  }

  const evidenceMap = new Map(input.evidence.map((e) => [e.id, e]));
  const cited = topPain.evidenceIds
    .map((id) => evidenceMap.get(id))
    .filter((e): e is BoIEvidence => !!e);
  const excerpt = cited.find((e) => e.excerpt?.trim())?.excerpt?.trim() ?? null;
  const evidenceIds = cited.slice(0, 2).map((e) => e.id);

  const location = input.city?.trim() ? ` in ${input.city.trim()}` : '';
  const segment = input.industry?.trim() ? ` (${input.industry.trim()})` : '';
  const name = input.businessName.trim() || 'your business';

  let opener = `Hi — I came across ${name}${location}${segment} and noticed ${painClause(topPain.label)}.`;

  if (excerpt) {
    opener += ` One reviewer noted: "${trimExcerpt(excerpt)}".`;
  }

  if (input.topService?.trim()) {
    opener += ` We help businesses like yours with ${input.topService.trim().toLowerCase()} — happy to share a quick idea if useful.`;
  } else if (input.pitchAngle?.trim()) {
    opener += ` ${input.pitchAngle.trim()}`;
  } else {
    opener += ` I'd welcome a short conversation if you're exploring improvements.`;
  }

  return {
    opener,
    evidenceIds,
    painId: topPain.id,
    painLabel: topPain.label,
  };
}
