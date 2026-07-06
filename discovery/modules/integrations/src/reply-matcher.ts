export function parseEmailAddress(fromHeader: string): string | null {
  const trimmed = fromHeader.trim();
  const bracket = trimmed.match(/<([^>]+)>/);
  if (bracket) return bracket[1].toLowerCase().trim();
  const plain = trimmed.match(/[\w.+-]+@[\w.-]+\.\w+/);
  return plain ? plain[0].toLowerCase() : null;
}

export function normalizeSubject(subject: string): string {
  return subject.replace(/^(re|fwd):\s*/gi, '').trim().toLowerCase();
}

export type ReplyMatchLead = {
  id: string;
  status: string;
  businessEmail: string | null;
  outreachSubjects: string[];
};

export function matchLeadForInboundReply(
  fromHeader: string,
  subject: string,
  leads: ReplyMatchLead[],
): string | null {
  const fromEmail = parseEmailAddress(fromHeader);
  if (!fromEmail) return null;

  const eligible = leads.filter(
    (l) =>
      (l.status === 'CONTACTED' || l.status === 'NO_RESPONSE') &&
      l.businessEmail?.toLowerCase() === fromEmail,
  );
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0].id;

  const normSubject = normalizeSubject(subject);
  for (const lead of eligible) {
    for (const outreachSubject of lead.outreachSubjects) {
      const normOutreach = normalizeSubject(outreachSubject);
      if (!normOutreach) continue;
      if (normSubject.includes(normOutreach) || normOutreach.includes(normSubject)) {
        return lead.id;
      }
    }
  }

  return eligible[0].id;
}
