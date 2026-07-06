import { integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { leads } from './crm';
import { proposals } from './proposal';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 300 }).notNull(),
  leadId: uuid('lead_id').references(() => leads.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const revenueRecords = pgTable('revenue_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  leadId: uuid('lead_id').references(() => leads.id),
  proposalId: uuid('proposal_id').references(() => proposals.id),
  amount: integer('amount').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  closedAt: timestamp('closed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
