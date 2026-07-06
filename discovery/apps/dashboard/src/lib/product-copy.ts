/**
 * v1 product language — Path A web agency charter.
 * @see docs/V1_CHARTER.md
 */

export const PRODUCT = {
  name: 'Demand Capture',
  edition: 'Web agency · v1',
  tagline: 'Find opportunities · Pursue honestly · Close revenue',
} as const;

export type NavItem = { href: string; label: string };

export type NavSection = { label: string; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Start',
    items: [{ href: '/ops', label: 'Today' }],
  },
  {
    label: 'Find',
    items: [
      { href: '/discovery', label: 'Discovery runs' },
      { href: '/intent/inbox', label: 'Demand inbox' },
      { href: '/intent', label: 'Add demand' },
    ],
  },
  {
    label: 'Triage',
    items: [{ href: '/review', label: 'Work queue' }],
  },
  {
    label: 'Pursue',
    items: [
      { href: '/leads', label: 'Pursuits' },
      { href: '/outreach', label: 'Outreach' },
      { href: '/follow-ups', label: 'Follow-ups' },
    ],
  },
  {
    label: 'Close',
    items: [
      { href: '/proposals', label: 'Proposals' },
      { href: '/revenue', label: 'Revenue' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/data-quality', label: 'Data quality' },
      { href: '/settings', label: 'Settings' },
    ],
  },
];

export const PAGE_COPY = {
  ops: {
    title: 'Today',
    description:
      'Daily start — revenue proof, acquisition KPIs, work queue backlog, and pursuit funnel. Work demand first, then verified opportunities.',
  },
  discovery: {
    title: 'Discovery runs',
    description: 'Proactive prospecting by geo and industry. Runs the full pipeline: crawl, signals, scoring.',
  },
  demandInbox: {
    title: 'Demand inbox',
    description:
      'Hot demand only — orphan signals from RSS, Reddit, and paste. For daily triage use Work queue (demand + opportunities together).',
  },
  addDemand: {
    title: 'Add demand',
    description:
      'Paste real demand (job posts, help requests, referrals). Unmatched signals land in Demand inbox. Enrichment from discovery crawls is separate.',
  },
  workQueue: {
    title: 'Work queue',
    description:
      'Daily triage — hot demand first, then verified discovery opportunities, then the rest. Open the Opportunity Brief on each lead before outreach.',
  },
  opportunities: {
    title: 'Opportunities',
    description:
      'Pre-pursuit accounts from discovery and demand. Verified prospects have email, phone, or Places confirmation. Promote to a pursuit when ready to contact.',
  },
  pursuits: {
    title: 'Pursuits',
    description: 'Active sales motions — outreach, follow-up, qualification, and proposals per account.',
  },
  outreach: {
    title: 'Outreach',
    description:
      'Honest outreach — BOI-personalized openers merge with templates. Copy, edit, record sends externally.',
  },
  followUps: {
    title: 'Follow-ups',
    description: 'Contacted pursuits due for a follow-up. Record replies to advance the funnel.',
  },
  proposals: {
    title: 'Proposals',
    description: 'Draft and send proposals for qualified pursuits.',
  },
  revenue: {
    title: 'Revenue',
    description: 'Close won deals and track revenue proof — the north star beyond lead count.',
  },
  settings: {
    title: 'Platform settings',
    description: 'Acquisition budgets, ICP scoring, credentials, and integrations.',
  },
} as const;

/** Business Opportunity Intelligence — operator-facing BOI labels */
export const BOI_COPY = {
  productName: 'Business Opportunity Intelligence',
  shortName: 'BOI',
  opportunityBrief: 'Opportunity Brief',
  viewBrief: 'View opportunity brief',
  hideBrief: 'Hide opportunity brief',
  loading: 'Loading opportunity brief…',
  retry: 'Retry',
  purchaseReadiness: 'Purchase readiness',
  topPains: 'Evidence-backed pains',
  digitalGaps: 'Digital gaps',
  recommendedServices: 'Recommended services',
  pitchAngle: 'Pitch angle',
  executiveSummary: 'Executive summary',
  narrativeSource: {
    rules: 'Rules-based',
    llm: 'AI-enhanced',
  } as const,
  customerSentiment: 'Customer sentiment',
  praiseThemes: 'What customers praise',
  complaintThemes: 'Complaint themes',
  techStack: 'Technology detected',
  projectValue: 'Indicative project value',
  projectValueDisclaimer: 'Rules-based estimate — not a quote. Validate scope on discovery call.',
  pageSpeed: 'Mobile performance',
  pageSpeedScore: 'PageSpeed score',
  evidence: 'Supporting evidence',
  emptyRunning:
    'Pipeline still running — the opportunity brief is generated after profile enrichment and Places review.',
  emptyCompleted:
    'No opportunity brief yet. This business may need more enrichment data (reviews, crawl, or contact paths).',
  partialNote: 'Partial intelligence — more data may arrive as the pipeline completes.',
  errorLoad: 'Could not load opportunity brief.',
  readinessBands: {
    high: 'High readiness',
    medium: 'Medium readiness',
    low: 'Low readiness',
    unknown: 'Readiness unknown',
  } as const,
  status: {
    ready: 'Ready',
    partial: 'Partial',
    pending: 'Pending',
  } as const,
} as const;

export const V1_CHARTER_SUMMARY = {
  icp: 'Web and digital agencies hunting local SMB website work.',
  workflow: 'Find (discovery + demand) → Triage (work queue) → Pursue → Close (revenue).',
  nonGoals: [
    'Tender / procurement platform',
    'Public multi-tenant SaaS on v1',
    'Automated mass email',
    'Generic any-industry lead gen',
  ],
} as const;
