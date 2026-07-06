import { CrmService } from '@agency/crm';
import { ProposalService } from '@agency/proposal';
import type { LeadStatus } from '@agency/types';
import { RevenueRepository } from './repository';
import { assertLeadCanCloseDeal } from './rules';

export class RevenueService {
  private repo = new RevenueRepository();
  private crm = new CrmService();
  private proposals = new ProposalService();

  async closeDeal(data: {
    leadId: string;
    clientName: string;
    amount: number;
    type: 'one_time' | 'retainer';
    proposalId?: string;
  }) {
    const lead = await this.crm.getLead(data.leadId);
    if (!lead) throw new Error('Lead not found');
    assertLeadCanCloseDeal(lead.status as LeadStatus);

    let proposalId = data.proposalId;
    if (proposalId) {
      await this.proposals.acceptProposal(proposalId, data.leadId);
    } else {
      const sent = await this.proposals.getLatestSentForLead(data.leadId);
      if (sent) {
        proposalId = sent.id;
        await this.proposals.acceptProposal(sent.id, data.leadId);
      }
    }

    const client = await this.repo.createClient({
      name: data.clientName,
      leadId: data.leadId,
    });
    const record = await this.repo.createRecord({
      clientId: client.id,
      leadId: data.leadId,
      proposalId,
      amount: data.amount,
      type: data.type,
    });
    await this.crm.transition(data.leadId, 'CLOSED_WON', 'Deal closed — revenue recorded');
    return { client, record, proposalId: proposalId ?? null };
  }

  async listCloseableDeals() {
    const rows = await this.repo.listProposalSentLeads();
    const deals = [];
    for (const row of rows) {
      const proposal = await this.proposals.getLatestSentForLead(row.lead.id);
      deals.push({
        lead: row.lead,
        business: row.business,
        proposal,
      });
    }
    return deals;
  }

  async getSummary() {
    const records = await this.repo.listRecords();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtd = records
      .filter((r) => r.closedAt >= monthStart)
      .reduce((sum, r) => sum + r.amount, 0);
    const total = records.reduce((sum, r) => sum + r.amount, 0);
    const retainer = records.filter((r) => r.type === 'retainer').length;
    return {
      mtd,
      total,
      dealCount: records.length,
      retainerCount: retainer,
      records,
    };
  }

  listRecords() {
    return this.repo.listRecords();
  }
}
