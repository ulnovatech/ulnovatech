import type { LeadStatus } from '@agency/types';

export function assertLeadCanCreateProposal(status: LeadStatus, autoQualify = false): void {
  if (status === 'QUALIFIED') return;
  if (status === 'REPLIED' && autoQualify) return;
  if (status === 'REPLIED') {
    throw new Error(
      'Cannot create proposal: lead must be QUALIFIED (currently REPLIED). Qualify the lead or pass autoQualify.',
    );
  }
  throw new Error(`Cannot create proposal from status ${status}. Lead must be QUALIFIED or REPLIED with autoQualify.`);
}

export function assertLeadCanSendProposal(status: LeadStatus): void {
  if (status !== 'QUALIFIED') {
    throw new Error(`Cannot send proposal: lead must be QUALIFIED (currently ${status})`);
  }
}
