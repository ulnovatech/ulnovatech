import type { OpportunityType } from '@agency/scoring';
import { OPPORTUNITY_TYPE_LABELS } from '@agency/scoring';

export type DefaultOutreachTemplate = {
  opportunityType: OpportunityType;
  name: string;
  subject: string;
  body: string;
  channel: 'email';
};

export const DEFAULT_OUTREACH_TEMPLATES: DefaultOutreachTemplate[] = [
  {
    opportunityType: 'demand_response',
    name: `Outreach — ${OPPORTUNITY_TYPE_LABELS.demand_response}`,
    subject: 'Re: your web request — {{business}}',
    body: `Hi {{name}},

I saw your recent request for web help and wanted to reach out directly about {{business}}. We help local businesses in {{city}} launch and improve sites that bring in real enquiries.

Would a 15-minute call this week work to understand what you need?`,
    channel: 'email',
  },
  {
    opportunityType: 'greenfield',
    name: `Outreach — ${OPPORTUNITY_TYPE_LABELS.greenfield}`,
    subject: 'A professional website for {{business}}',
    body: `Hi {{name}},

I noticed {{business}} in {{city}} doesn't have a website yet — many customers search online before they call or visit.

We build starter sites for local businesses. Open to a quick call to see if a simple launch package fits?`,
    channel: 'email',
  },
  {
    opportunityType: 'redesign',
    name: `Outreach — ${OPPORTUNITY_TYPE_LABELS.redesign}`,
    subject: "Quick win for {{business}}'s website",
    body: `Hi {{name}},

I took a look at {{business}}'s site{{website}} and think a focused refresh could improve trust and mobile conversions without a full rebuild.

We do fixed-scope redesigns for local businesses. Worth a short call to share one concrete improvement idea?`,
    channel: 'email',
  },
  {
    opportunityType: 'modernize',
    name: `Outreach — ${OPPORTUNITY_TYPE_LABELS.modernize}`,
    subject: "Modernize {{business}}'s web presence",
    body: `Hi {{name}},

{{business}}'s website could benefit from a credibility upgrade — HTTPS, mobile polish, and clearer calls-to-action often lift enquiries with minimal disruption.

We help local businesses modernize incrementally. Open to a 10-minute chat?`,
    channel: 'email',
  },
  {
    opportunityType: 'general',
    name: 'Outreach — general intro',
    subject: 'Quick idea for {{business}}',
    body: `Hi {{name}},

I work with local businesses in {{city}} on websites that turn visitors into leads. I thought {{business}} might be a fit.

Would you be open to a short call this week?`,
    channel: 'email',
  },
];

export const OUTREACH_OPPORTUNITY_TYPES = DEFAULT_OUTREACH_TEMPLATES.map((t) => t.opportunityType);
