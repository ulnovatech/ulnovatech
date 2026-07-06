import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { leads } from './crm';

export const proposals = pgTable('proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id')
    .notNull()
    .references(() => leads.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  amount: integer('amount').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  body: text('body'),
  documentUrl: varchar('document_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
