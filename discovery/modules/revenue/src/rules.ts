import type { LeadStatus } from '@agency/types';

export function assertLeadCanCloseDeal(status: LeadStatus): void {
  if (status !== 'PROPOSAL_SENT') {
    throw new Error(`Cannot close deal: lead must be PROPOSAL_SENT (currently ${status})`);
  }
}
