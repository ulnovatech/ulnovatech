export type DiscoveryRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type LeadStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'CONTACTED'
  | 'REPLIED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'CLOSED_WON'
  | 'CLOSED_LOST'
  | 'NO_RESPONSE'
  | 'NOT_INTERESTED'
  | 'ARCHIVED';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export type RevenueType = 'one_time' | 'retainer';

export type OutreachChannel = 'email' | 'linkedin' | 'phone' | 'other';

export type IntentSignalType =
  | 'job_post'
  | 'hiring'
  | 'help_request'
  | 'pain_signal'
  | 'public_request'
  | 'other';

export const LEAD_STATUSES: LeadStatus[] = [
  'NEW',
  'REVIEWED',
  'CONTACTED',
  'REPLIED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'ARCHIVED',
];
