import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { businesses } from './discovery';

export const intentSignals = pgTable('intent_signals', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  discoveryRunId: uuid('discovery_run_id'),
  source: varchar('source', { length: 50 }).notNull(),
  signalType: varchar('signal_type', { length: 50 }).notNull(),
  signalClass: varchar('signal_class', { length: 20 }).notNull().default('enrichment'),
  signalStrength: integer('signal_strength').notNull().default(50),
  title: varchar('title', { length: 500 }),
  snippet: text('snippet'),
  sourceUrl: varchar('source_url', { length: 1000 }),
  capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
});
