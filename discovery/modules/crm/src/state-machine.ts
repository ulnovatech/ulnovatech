import type { LeadStatus } from '@agency/types';

export const TERMINAL_LEAD_STATUSES: LeadStatus[] = ['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'];

export function isTerminalLeadStatus(status: LeadStatus): boolean {
  return TERMINAL_LEAD_STATUSES.includes(status);
}

const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['REVIEWED', 'CONTACTED', 'ARCHIVED'],
  REVIEWED: ['CONTACTED', 'ARCHIVED'],
  CONTACTED: ['REPLIED', 'NO_RESPONSE', 'CLOSED_LOST', 'ARCHIVED'],
  REPLIED: ['QUALIFIED', 'NOT_INTERESTED', 'CLOSED_LOST', 'ARCHIVED'],
  QUALIFIED: ['PROPOSAL_SENT', 'CLOSED_LOST', 'ARCHIVED'],
  PROPOSAL_SENT: ['CLOSED_WON', 'CLOSED_LOST', 'ARCHIVED'],
  CLOSED_WON: ['ARCHIVED'],
  CLOSED_LOST: ['ARCHIVED'],
  NO_RESPONSE: ['CONTACTED', 'REPLIED', 'CLOSED_LOST', 'ARCHIVED'],
  NOT_INTERESTED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(from: LeadStatus): LeadStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function assertTransition(from: LeadStatus, to: LeadStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid lead transition: ${from} -> ${to}`);
  }
}
