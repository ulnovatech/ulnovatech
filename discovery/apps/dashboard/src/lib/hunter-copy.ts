/**
 * Live Market Hunter — product copy and navigation (isolated from agency NAV_SECTIONS).
 */

export const HUNTER_PRODUCT = {
  name: 'Live Market Hunter',
  edition: 'Product gap intelligence',
  tagline: 'Find what to build · Prove demand · Ship with visibility',
} as const;

export type HunterNavItem = { href: string; label: string };

export const HUNTER_NAV: HunterNavItem[] = [
  { href: '/hunter', label: 'Scans' },
];

export const HUNTER_COPY = {
  home: {
    title: 'Market scans',
    description:
      'Run marketplace research across enabled platforms. Ranked action cards tell you what digital product to build next — approve one, dismiss the rest.',
  },
  scanDetail: {
    title: 'Scan detail',
    description: 'Live progress, spend, and ranked build opportunities from this run.',
  },
  emptyScans: {
    title: 'No scans yet',
    description: 'Start your first scan to surface Type 2 and Type 3 product gaps from live marketplace data.',
  },
  emptyCards: {
    title: 'No action cards',
    description:
      'This scan completed without actionable gaps — try different platforms or categories in Settings.',
  },
  running: {
    title: 'Scan in progress',
    description: 'Researching listings, filtering ghosts, and scoring gaps. This may take a few minutes.',
  },
  error: {
    title: 'Scan failed',
    description: 'Check API keys and platform toggles in Settings, then start a new scan.',
  },
  approved: {
    title: 'Approved for build',
    description: 'You marked this opportunity as your build target for this week.',
  },
} as const;

export function gapTypeLabel(gapType: 'TYPE_2' | 'TYPE_3'): string {
  if (gapType === 'TYPE_2') return 'Type 2 — proven sales + fixable complaints';
  return 'Type 3 — proven sales + stale product';
}

export function scanStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Queued';
    case 'running':
      return 'Running';
    case 'completed':
      return 'Complete';
    case 'failed':
      return 'Failed';
    case 'partial':
      return 'Partial';
    default:
      return status;
  }
}
