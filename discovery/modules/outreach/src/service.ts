import { AccountService } from '@agency/accounts';
import { CrmService } from '@agency/crm';
import {
  meetsMinReachability,
  type MinReachabilityLevel,
  type Reachability,
} from '@agency/scoring';
import type { OpportunityType } from '@agency/scoring';
import { hasContactPath, resolveExportStatuses } from './export-gates';
import { OutreachRepository } from './repository';
import { buildMergeContext, mergeTemplate } from './template-merge';
import { composeOutreachBody } from './compose-outreach-body';

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class OutreachService {
  private repo = new OutreachRepository();
  private crm = new CrmService();
  private accounts = new AccountService();

  private mergeDataFromRow(row: {
    business: {
      name: string;
      city: string | null;
      website: string | null;
      email: string | null;
      phone: string | null;
      googleMapsUrl: string | null;
      sourceUrl: string | null;
    };
    account: {
      canonicalName: string;
      city: string | null;
      website: string | null;
      email: string | null;
      phone: string | null;
      googleMapsUrl: string | null;
      sourceUrl: string | null;
      suppressed: boolean;
    };
  }) {
    return buildMergeContext({
      businessName: row.business.name,
      canonicalName: row.account.canonicalName,
      city: row.account.city ?? row.business.city,
      website: row.account.website ?? row.business.website,
      email: row.account.email ?? row.business.email,
      phone: row.account.phone ?? row.business.phone,
      googleMapsUrl: row.account.googleMapsUrl ?? row.business.googleMapsUrl,
      sourceUrl: row.account.sourceUrl ?? row.business.sourceUrl,
    });
  }

  private async assertLeadCanReceiveOutreach(leadId: string) {
    const row = await this.repo.getLeadMergeData(leadId);
    if (!row) throw new Error('Lead not found');
    if (await this.accounts.isSuppressed(row.account)) {
      throw new Error('Account is suppressed — outreach blocked');
    }
    const email = row.account.email ?? row.business.email;
    const phone = row.account.phone ?? row.business.phone;
    if (!hasContactPath(email, phone)) {
      throw new Error('Lead has no email or phone contact path');
    }
    return row;
  }

  async previewMessage(leadId: string, templateId: string, options?: { opener?: string | null }) {
    const row = await this.assertLeadCanReceiveOutreach(leadId);
    const template = await this.repo.getTemplate(templateId);
    if (!template) throw new Error('Template not found');

    const ctx = this.mergeDataFromRow(row);
    const mergedBody = mergeTemplate(template.body, ctx);
    const body = composeOutreachBody(mergedBody, options?.opener);

    return {
      leadId,
      templateId,
      channel: template.channel,
      subject: template.subject ? mergeTemplate(template.subject, ctx) : null,
      body,
      context: ctx,
      business: row.business.name,
      leadStatus: row.lead.status,
      openerApplied: !!options?.opener?.trim(),
    };
  }

  async exportCsv(options: {
    templateId: string;
    date?: string;
    includeUnreviewed?: boolean;
    owner?: string;
    minReachability?: MinReachabilityLevel;
  }) {
    const template = await this.repo.getTemplate(options.templateId);
    if (!template) throw new Error('Template not found');

    const statuses = resolveExportStatuses(!!options.includeUnreviewed);
    const rows = await this.repo.listLeadsForExport({
      statuses,
      excludeContactedToday: options.date === 'today',
      owner: options.owner,
    });

    const header = ['business', 'email', 'phone', 'subject', 'body', 'maps_url'];
    const lines = [header.join(',')];
    let skippedNoContact = 0;
    let skippedSuppressed = 0;
    let skippedReachability = 0;
    const minReachability = options.minReachability ?? 'low';

    for (const row of rows) {
      const email = row.account.email ?? row.business.email;
      const phone = row.account.phone ?? row.business.phone;
      if (!hasContactPath(email, phone)) {
        skippedNoContact++;
        continue;
      }
      if (await this.accounts.isSuppressed(row.account)) {
        skippedSuppressed++;
        continue;
      }
      const reachability = (row.leadScore?.reachability as Reachability | null) ?? 'none';
      if (!meetsMinReachability(reachability, minReachability)) {
        skippedReachability++;
        continue;
      }

      const ctx = this.mergeDataFromRow(row);
      const subject = template.subject ? mergeTemplate(template.subject, ctx) : '';
      const body = mergeTemplate(template.body, ctx);
      lines.push(
        [
          csvEscape(ctx.business),
          csvEscape(ctx.email),
          csvEscape(ctx.phone),
          csvEscape(subject),
          csvEscape(body),
          csvEscape(ctx.mapsUrl),
        ].join(','),
      );
    }

    const dateSuffix = options.date === 'today' ? new Date().toISOString().slice(0, 10) : 'all';
    return {
      csv: lines.join('\n'),
      filename: `outreach-export-${dateSuffix}.csv`,
      count: lines.length - 1,
      skippedNoContact,
      skippedSuppressed,
      skippedReachability,
      statuses,
      minReachability,
    };
  }

  createTemplate(data: {
    name: string;
    subject?: string;
    body: string;
    channel: string;
    opportunityType?: OpportunityType | null;
  }) {
    return this.repo.createTemplate(data);
  }

  async ensureDefaultTemplates() {
    return this.repo.ensureDefaultTemplates();
  }

  async listTemplates() {
    await this.repo.ensureDefaultTemplates();
    return this.repo.listTemplates();
  }

  async resolveTemplateForOpportunityType(type: OpportunityType) {
    await this.repo.ensureDefaultTemplates();
    const match = await this.repo.getTemplateByOpportunityType(type);
    if (match) return match;
    return this.repo.getTemplateByOpportunityType('general');
  }

  async sendMessage(data: {
    leadId: string;
    templateId?: string;
    subject?: string;
    body: string;
    channel: string;
    markContacted?: boolean;
  }) {
    await this.assertLeadCanReceiveOutreach(data.leadId);

    const message = await this.repo.createMessage({
      ...data,
      sentAt: new Date(),
    });
    if (data.markContacted !== false) {
      await this.crm.recordOutreachSent(data.leadId);
    }
    return message;
  }

  listMessages(leadId?: string) {
    return this.repo.listMessages(leadId);
  }
}
