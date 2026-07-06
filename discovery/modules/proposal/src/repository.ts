import { getDb, businesses, leads, proposals } from '@agency/database';
import { and, desc, eq } from 'drizzle-orm';

export class ProposalRepository {
  async create(data: {
    leadId: string;
    title: string;
    amount: number;
    body?: string;
  }) {
    const db = getDb();
    const [p] = await db.insert(proposals).values(data).returning();
    return p;
  }

  async list(leadId?: string) {
    const db = getDb();
    if (leadId) {
      return db
        .select()
        .from(proposals)
        .where(eq(proposals.leadId, leadId))
        .orderBy(desc(proposals.createdAt));
    }
    return db.select().from(proposals).orderBy(desc(proposals.createdAt));
  }

  async listWithDetails(leadId?: string) {
    const db = getDb();
    const base = db
      .select({
        id: proposals.id,
        leadId: proposals.leadId,
        title: proposals.title,
        amount: proposals.amount,
        status: proposals.status,
        body: proposals.body,
        createdAt: proposals.createdAt,
        updatedAt: proposals.updatedAt,
        businessName: businesses.name,
        leadStatus: leads.status,
      })
      .from(proposals)
      .innerJoin(leads, eq(proposals.leadId, leads.id))
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .orderBy(desc(proposals.createdAt));

    if (leadId) {
      return base.where(eq(proposals.leadId, leadId));
    }
    return base;
  }

  async getLeadContext(leadId: string) {
    const db = getDb();
    const [row] = await db
      .select({ lead: leads, business: businesses })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .where(eq(leads.id, leadId));
    return row ?? null;
  }

  async getLatestSentForLead(leadId: string) {
    const db = getDb();
    const [p] = await db
      .select()
      .from(proposals)
      .where(and(eq(proposals.leadId, leadId), eq(proposals.status, 'sent')))
      .orderBy(desc(proposals.updatedAt))
      .limit(1);
    return p ?? null;
  }

  async get(id: string) {
    const db = getDb();
    const [p] = await db.select().from(proposals).where(eq(proposals.id, id));
    return p ?? null;
  }

  async updateStatus(id: string, status: string) {
    const db = getDb();
    const [p] = await db
      .update(proposals)
      .set({ status, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    return p;
  }
}
