import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { leads } from './crm';

export const gmailReplySuggestions = pgTable('gmail_reply_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  gmailMessageId: varchar('gmail_message_id', { length: 200 }).notNull().unique(),
  threadId: varchar('thread_id', { length: 200 }),
  fromEmail: varchar('from_email', { length: 300 }),
  subject: varchar('subject', { length: 500 }),
  snippet: text('snippet'),
  receivedAt: timestamp('received_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
