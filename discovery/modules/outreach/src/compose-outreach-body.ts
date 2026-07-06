/**
 * Prepends a BOI outreach opener to a merged template body without duplicating content.
 */
export function composeOutreachBody(templateBody: string, opener?: string | null): string {
  const body = templateBody.trim();
  const lead = opener?.trim();
  if (!lead) return templateBody;
  if (body.startsWith(lead)) return templateBody;
  return `${lead}\n\n${body}`;
}

export type OpenerEvidenceRef = {
  id: string;
  label: string;
  excerpt?: string | null;
};

export type RecommendedOutreachEnrichment = {
  suggestedOpener: string | null;
  openerPainId: string | null;
  openerPainLabel: string | null;
  openerEvidence: OpenerEvidenceRef[];
};
