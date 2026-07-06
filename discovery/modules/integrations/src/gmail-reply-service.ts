import { CrmService } from '@agency/crm';
import { businesses, getDb, gmailReplySuggestions, leads, outreachMessages } from '@agency/database';
import { platformSettings } from '@agency/settings';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getGmailOAuthConfig, isGmailConnected } from './gmail-config';
import {
  getGmailMessage,
  listInboxMessageIds,
  refreshGmailAccessToken,
} from './gmail-client';
import { matchLeadForInboundReply, parseEmailAddress, type ReplyMatchLead } from './reply-matcher';

export class GmailReplyService {
  private crm = new CrmService();

  async getConnectionStatus() {
    const connected = await isGmailConnected();
    return { connected, readonly: true as const };
  }

  async disconnect() {
    await platformSettings.ensureLoaded();
    await platformSettings.updateCredentials({ gmail_oauth_refresh_token: '' });
    return { connected: false };
  }

  async syncReplies(newerThanDays = 7) {
    const config = await getGmailOAuthConfig();
    if (!config) throw new Error('Gmail is not connected');

    const accessToken = await refreshGmailAccessToken(
      config.clientId,
      config.clientSecret,
      config.refreshToken,
    );

    const messageIds = await listInboxMessageIds(accessToken, newerThanDays);
    const matchLeads = await this.loadMatchLeads();
    let created = 0;
    let scanned = 0;

    for (const messageId of messageIds) {
      scanned++;
      const exists = await this.findByGmailMessageId(messageId);
      if (exists) continue;

      const message = await getGmailMessage(accessToken, messageId);
      const leadId = matchLeadForInboundReply(message.from, message.subject, matchLeads);
      if (!leadId) continue;

      await this.insertSuggestion({
        leadId,
        gmailMessageId: message.id,
        threadId: message.threadId,
        fromEmail: parseEmailAddress(message.from),
        subject: message.subject,
        snippet: message.snippet,
        receivedAt: message.receivedAt,
      });
      created++;
    }

    return { scanned, created };
  }

  async listPendingForLead(leadId: string) {
    const db = getDb();
    return db
      .select()
      .from(gmailReplySuggestions)
      .where(
        and(
          eq(gmailReplySuggestions.leadId, leadId),
          eq(gmailReplySuggestions.status, 'pending'),
        ),
      )
      .orderBy(desc(gmailReplySuggestions.receivedAt));
  }

  async confirmSuggestion(leadId: string, suggestionId: string) {
    const suggestion = await this.getSuggestion(suggestionId);
    if (!suggestion || suggestion.leadId !== leadId) {
      throw new Error('Suggestion not found');
    }
    if (suggestion.status !== 'pending') {
      throw new Error('Suggestion already handled');
    }

    const note = [suggestion.subject, suggestion.snippet].filter(Boolean).join(' — ');
    await this.crm.markReplied(leadId, {
      channel: 'email',
      note: note.slice(0, 500) || undefined,
    });
    await this.updateSuggestionStatus(suggestionId, 'confirmed');
    return { ok: true as const };
  }

  async dismissSuggestion(leadId: string, suggestionId: string) {
    const suggestion = await this.getSuggestion(suggestionId);
    if (!suggestion || suggestion.leadId !== leadId) {
      throw new Error('Suggestion not found');
    }
    if (suggestion.status !== 'pending') {
      throw new Error('Suggestion already handled');
    }
    await this.updateSuggestionStatus(suggestionId, 'dismissed');
    return { ok: true as const };
  }

  private async loadMatchLeads(): Promise<ReplyMatchLead[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: leads.id,
        status: leads.status,
        email: businesses.email,
      })
      .from(leads)
      .innerJoin(businesses, eq(leads.businessId, businesses.id))
      .where(inArray(leads.status, ['CONTACTED', 'NO_RESPONSE']));

    const leadIds = rows.map((r) => r.id);
    const outreachRows =
      leadIds.length === 0
        ? []
        : await db
            .select({ leadId: outreachMessages.leadId, subject: outreachMessages.subject })
            .from(outreachMessages)
            .where(inArray(outreachMessages.leadId, leadIds));

    const subjectsByLead = new Map<string, string[]>();
    for (const row of outreachRows) {
      if (!row.subject?.trim()) continue;
      const list = subjectsByLead.get(row.leadId) ?? [];
      list.push(row.subject);
      subjectsByLead.set(row.leadId, list);
    }

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      businessEmail: r.email,
      outreachSubjects: subjectsByLead.get(r.id) ?? [],
    }));
  }

  private async findByGmailMessageId(gmailMessageId: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(gmailReplySuggestions)
      .where(eq(gmailReplySuggestions.gmailMessageId, gmailMessageId))
      .limit(1);
    return row ?? null;
  }

  private async insertSuggestion(data: {
    leadId: string;
    gmailMessageId: string;
    threadId: string | null;
    fromEmail: string | null;
    subject: string;
    snippet: string;
    receivedAt: Date | null;
  }) {
    const db = getDb();
    const [row] = await db
      .insert(gmailReplySuggestions)
      .values({
        leadId: data.leadId,
        gmailMessageId: data.gmailMessageId,
        threadId: data.threadId,
        fromEmail: data.fromEmail,
        subject: data.subject,
        snippet: data.snippet,
        receivedAt: data.receivedAt,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning();
    return row ?? null;
  }

  private async getSuggestion(id: string) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(gmailReplySuggestions)
      .where(eq(gmailReplySuggestions.id, id))
      .limit(1);
    return row ?? null;
  }

  private async updateSuggestionStatus(id: string, status: 'confirmed' | 'dismissed') {
    const db = getDb();
    await db.update(gmailReplySuggestions).set({ status }).where(eq(gmailReplySuggestions.id, id));
  }
}
