import { DiscoveryRepository } from '@agency/discovery';
import { platformSettings } from '@agency/settings';
import type { LeadStatus } from '@agency/types';
import { assertTransition, canTransition } from './state-machine';
import { CrmRepository } from './repository';

export class CrmService {
  private repo = new CrmRepository();
  private discoveryRepo = new DiscoveryRepository();

  async createLeadFromBusiness(data: {
    businessId: string;
    priority?: string;
    owner?: string;
    status?: 'NEW' | 'REVIEWED';
    promoteOnly?: boolean;
  }) {
    const business = await this.discoveryRepo.getBusiness(data.businessId);
    if (!business) throw new Error('Business not found');
    if (!business.accountId) throw new Error('Business has no linked account');

    const status: 'NEW' | 'REVIEWED' = data.promoteOnly
      ? 'REVIEWED'
      : (data.status ?? 'NEW');

    const activeLead = await this.repo.getActiveLeadByAccount(business.accountId);
    if (activeLead) {
      throw new Error('Active lead already exists for this account');
    }

    const lead = await this.repo.createLead({
      accountId: business.accountId,
      businessId: data.businessId,
      priority: data.priority,
      owner: data.owner,
      status,
    });
    const activity =
      status === 'REVIEWED'
        ? 'Lead promoted to REVIEWED from review queue'
        : 'Lead created from review queue';
    await this.repo.addActivity(lead.id, 'created', activity);
    return lead;
  }

  async transition(leadId: string, toStatus: LeadStatus, note?: string) {
    const lead = await this.repo.getLead(leadId);
    if (!lead) throw new Error('Lead not found');

    assertTransition(lead.status as LeadStatus, toStatus);
    const updated = await this.repo.updateLeadStatus(leadId, toStatus);
    await this.repo.addActivity(
      leadId,
      'status_change',
      `Status changed to ${toStatus}`,
      JSON.stringify({ from: lead.status, to: toStatus }),
    );
    if (note) await this.repo.addNote(leadId, note);

    if (toStatus === 'CONTACTED') {
      const days = platformSettings.getCrmSettings().followUpDaysAfterContact;
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + days);
      await this.repo.updateLead(leadId, { nextFollowUpAt: followUp });
    }

    if (toStatus === 'CLOSED_LOST' && note) {
      await this.repo.addActivity(leadId, 'closed_lost', `Deal lost: ${note}`);
    }

    return updated;
  }

  async recordOutreachSent(leadId: string) {
    const lead = await this.repo.getLead(leadId);
    if (!lead) throw new Error('Lead not found');

    const status = lead.status as LeadStatus;
    if (status === 'NEW' || status === 'REVIEWED') {
      return this.transition(leadId, 'CONTACTED', 'Outreach recorded — marked contacted');
    }
    return lead;
  }

  async markReplied(
    leadId: string,
    data?: { note?: string; channel?: string },
  ) {
    const lead = await this.repo.getLead(leadId);
    if (!lead) throw new Error('Lead not found');

    const status = lead.status as LeadStatus;
    if (status !== 'CONTACTED' && status !== 'NO_RESPONSE') {
      throw new Error(`Cannot mark replied from status ${status}`);
    }

    const channel = data?.channel?.trim();
    const channelSuffix = channel ? ` via ${channel}` : '';
    const noteText = data?.note?.trim();
    const transitionNote = noteText
      ? `Prospect replied${channelSuffix}: ${noteText}`
      : `Prospect replied${channelSuffix}`;

    const updated = await this.transition(leadId, 'REPLIED', transitionNote);
    await this.repo.addActivity(
      leadId,
      'reply_received',
      `Marked as replied${channelSuffix}`,
      JSON.stringify({ channel: channel ?? null, note: noteText ?? null }),
    );
    await this.repo.updateLead(leadId, { nextFollowUpAt: null });
    return updated;
  }

  async closeLost(leadId: string, reason?: string) {
    const lead = await this.repo.getLead(leadId);
    if (!lead) throw new Error('Lead not found');
    const from = lead.status as LeadStatus;
    if (!canTransition(from, 'CLOSED_LOST')) {
      throw new Error(`Cannot close lost from status ${from}`);
    }
    const note = reason?.trim() || 'Closed lost';
    return this.transition(leadId, 'CLOSED_LOST', note);
  }

  getLead(id: string) {
    return this.repo.getLead(id);
  }

  getLeadWithDetails(id: string) {
    return Promise.all([
      this.repo.getLead(id),
      this.repo.listNotes(id),
      this.repo.listActivities(id),
    ]).then(([lead, notes, activities]) => ({ lead, notes, activities }));
  }

  listLeads(owner?: string) {
    return this.repo.listLeads(owner);
  }

  listFollowUps(owner?: string) {
    return this.repo.listOverdueFollowUps(owner);
  }

  addNote(leadId: string, content: string) {
    return this.repo.addNote(leadId, content);
  }

  updatePriority(leadId: string, priority: string) {
    return this.repo.updateLead(leadId, { priority });
  }
}
