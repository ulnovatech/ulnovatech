import {
  getDb,
  accounts,
  businesses,
  leadScores,
  leads,
  outreachMessages,
  outreachTemplates,
} from '@agency/database';
import type { OpportunityType } from '@agency/scoring';
import { and, desc, eq, gte, inArray, notInArray, sql } from 'drizzle-orm';
import { DEFAULT_OUTREACH_TEMPLATES } from './default-templates';

export class OutreachRepository {
  async createTemplate(data: {
    name: string;
    subject?: string;
    body: string;
    channel: string;
    opportunityType?: OpportunityType | null;
  }) {
    const db = getDb();
    const [t] = await db.insert(outreachTemplates).values(data).returning();
    return t;
  }

  async listTemplates() {
    const db = getDb();
    return db
      .select()
      .from(outreachTemplates)
      .orderBy(outreachTemplates.opportunityType, desc(outreachTemplates.createdAt));
  }

  async getTemplateByOpportunityType(type: OpportunityType) {
    const db = getDb();
    const [t] = await db
      .select()
      .from(outreachTemplates)
      .where(eq(outreachTemplates.opportunityType, type))
      .orderBy(desc(outreachTemplates.createdAt))
      .limit(1);
    return t ?? null;
  }

  async ensureDefaultTemplates() {
    const db = getDb();
    let created = 0;
    for (const def of DEFAULT_OUTREACH_TEMPLATES) {
      const [existing] = await db
        .select({ id: outreachTemplates.id })
        .from(outreachTemplates)
        .where(eq(outreachTemplates.opportunityType, def.opportunityType))
        .limit(1);
      if (existing) continue;
      await db.insert(outreachTemplates).values({
        name: def.name,
        subject: def.subject,
        body: def.body,
        channel: def.channel,
        opportunityType: def.opportunityType,
      });
      created++;
    }
    return { created, total: DEFAULT_OUTREACH_TEMPLATES.length };
  }

  async getTemplate(id: string) {
    const db = getDb();
    const [t] = await db.select().from(outreachTemplates).where(eq(outreachTemplates.id, id));
    return t ?? null;
  }

  async getLeadMergeData(leadId: string) {
    const db = getDb();
    const [row] = await db
      .select({ lead: leads, business: businesses, account: accounts })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .innerJoin(accounts, eq(leads.accountId, accounts.id))
      .where(eq(leads.id, leadId));
    return row ?? null;
  }

  async listLeadsForExport(options: {
    statuses: string[];
    excludeContactedToday?: boolean;
    owner?: string;
  }) {
    const db = getDb();
    const priorityOrder = sql`CASE ${leads.priority}
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 3
      ELSE 4 END`;

    let contactedTodayIds: string[] = [];
    if (options.excludeContactedToday) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const rows = await db
        .select({ leadId: outreachMessages.leadId })
        .from(outreachMessages)
        .where(gte(outreachMessages.sentAt, startOfDay));
      contactedTodayIds = [...new Set(rows.map((r) => r.leadId))];
    }

    const filters = [inArray(leads.status, options.statuses)];
    if (options.owner) {
      filters.push(eq(leads.owner, options.owner));
    }
    if (contactedTodayIds.length > 0) {
      filters.push(notInArray(leads.id, contactedTodayIds));
    }
    const where = and(...filters);

    return db
      .select({
        lead: leads,
        business: businesses,
        account: accounts,
        leadScore: leadScores,
      })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .innerJoin(accounts, eq(leads.accountId, accounts.id))
      .leftJoin(leadScores, eq(leadScores.businessId, businesses.id))
      .where(where)
      .orderBy(priorityOrder, desc(leads.updatedAt));
  }

  async createMessage(data: {
    leadId: string;
    templateId?: string;
    subject?: string;
    body: string;
    channel: string;
    sentAt?: Date;
  }) {
    const db = getDb();
    const [m] = await db.insert(outreachMessages).values(data).returning();
    return m;
  }

  async listMessages(leadId?: string) {
    const db = getDb();
    if (leadId) {
      return db
        .select()
        .from(outreachMessages)
        .where(eq(outreachMessages.leadId, leadId))
        .orderBy(desc(outreachMessages.createdAt));
    }
    return db.select().from(outreachMessages).orderBy(desc(outreachMessages.createdAt));
  }
}
