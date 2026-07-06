import { getDb, businesses, clients, leads, revenueRecords } from '@agency/database';
import { desc, eq } from 'drizzle-orm';

export class RevenueRepository {
  async createClient(data: { name: string; leadId?: string }) {
    const db = getDb();
    const [c] = await db.insert(clients).values(data).returning();
    return c;
  }

  async createRecord(data: {
    clientId: string;
    leadId?: string;
    proposalId?: string;
    amount: number;
    type: string;
  }) {
    const db = getDb();
    const [r] = await db.insert(revenueRecords).values(data).returning();
    return r;
  }

  async listRecords() {
    const db = getDb();
    return db.select().from(revenueRecords).orderBy(desc(revenueRecords.closedAt));
  }

  async listClients() {
    const db = getDb();
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async listProposalSentLeads() {
    const db = getDb();
    return db
      .select({ lead: leads, business: businesses })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .where(eq(leads.status, 'PROPOSAL_SENT'))
      .orderBy(desc(leads.updatedAt));
  }
}
