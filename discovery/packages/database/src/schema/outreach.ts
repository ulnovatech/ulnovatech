import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { leads } from './crm';

export const outreachTemplates = pgTable('outreach_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  body: text('body').notNull(),
  channel: varchar('channel', { length: 20 }).notNull().default('email'),
  /** Matches @agency/scoring OpportunityType for auto-selection. */
  opportunityType: varchar('opportunity_type', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const outreachMessages = pgTable('outreach_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => outreachTemplates.id),
  subject: varchar('subject', { length: 500 }),
  body: text('body').notNull(),
  channel: varchar('channel', { length: 20 }).notNull().default('email'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
