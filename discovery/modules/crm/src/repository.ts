import { getDb, leads, leadNotes, leadActivities, businesses } from '@agency/database';
import { and, desc, eq, isNotNull, lte, notInArray } from 'drizzle-orm';
import { TERMINAL_LEAD_STATUSES } from './state-machine';

export class CrmRepository {
  async createLead(data: {
    accountId: string;
    businessId: string;
    priority?: string;
    owner?: string;
    status?: string;
  }) {
    const db = getDb();
    const [lead] = await db
      .insert(leads)
      .values({
        accountId: data.accountId,
        businessId: data.businessId,
        status: data.status ?? 'NEW',
        priority: data.priority ?? 'medium',
        owner: data.owner ?? 'operator',
      })
      .returning();
    return lead;
  }

  async getLead(id: string) {
    const db = getDb();
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead ?? null;
  }

  async getLeadByBusiness(businessId: string) {
    const db = getDb();
    const [lead] = await db.select().from(leads).where(eq(leads.businessId, businessId));
    return lead ?? null;
  }

  async getLeadByAccount(accountId: string) {
    const db = getDb();
    const [lead] = await db.select().from(leads).where(eq(leads.accountId, accountId));
    return lead ?? null;
  }

  async getActiveLeadByAccount(accountId: string) {
    const db = getDb();
    const [lead] = await db
      .select()
      .from(leads)
      .where(
        and(eq(leads.accountId, accountId), notInArray(leads.status, TERMINAL_LEAD_STATUSES)),
      )
      .limit(1);
    return lead ?? null;
  }

  async listLeads(owner?: string) {
    const db = getDb();
    const query = db
      .select({ lead: leads, business: businesses })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id));

    if (owner) {
      return query.where(eq(leads.owner, owner)).orderBy(desc(leads.updatedAt));
    }

    return query.orderBy(desc(leads.updatedAt));
  }

  async updateLeadStatus(id: string, status: string) {
    const db = getDb();
    const [lead] = await db
      .update(leads)
      .set({ status, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async updateLead(id: string, data: { priority?: string; nextFollowUpAt?: Date | null }) {
    const db = getDb();
    const [lead] = await db
      .update(leads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async addNote(leadId: string, content: string) {
    const db = getDb();
    const [note] = await db.insert(leadNotes).values({ leadId, content }).returning();
    return note;
  }

  async listNotes(leadId: string) {
    const db = getDb();
    return db
      .select()
      .from(leadNotes)
      .where(eq(leadNotes.leadId, leadId))
      .orderBy(desc(leadNotes.createdAt));
  }

  async addActivity(leadId: string, type: string, description: string, metadata?: string) {
    const db = getDb();
    const [activity] = await db
      .insert(leadActivities)
      .values({ leadId, type, description, metadata })
      .returning();
    return activity;
  }

  async listActivities(leadId: string) {
    const db = getDb();
    return db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }

  async listOverdueFollowUps(owner?: string) {
    const db = getDb();
    const now = new Date();
    const conditions = [
      eq(leads.status, 'CONTACTED'),
      isNotNull(leads.nextFollowUpAt),
      lte(leads.nextFollowUpAt, now),
    ];
    if (owner) {
      conditions.push(eq(leads.owner, owner));
    }
    return db
      .select({ lead: leads, business: businesses })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .where(and(...conditions))
      .orderBy(leads.nextFollowUpAt);
  }
}
