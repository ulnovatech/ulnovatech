import { integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { discoveryRuns } from './discovery';

export const acquisitionJobs = pgTable('acquisition_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id')
    .notNull()
    .references(() => discoveryRuns.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  errorMessage: text('error_message'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const budgetLedger = pgTable('budget_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: varchar('provider', { length: 50 }).notNull(),
  operation: varchar('operation', { length: 50 }).notNull(),
  units: integer('units').notNull().default(1),
  runId: uuid('run_id').references(() => discoveryRuns.id, { onDelete: 'set null' }),
  /** Reserved for Chunk C2 canonical accounts */
  accountId: uuid('account_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const acquisitionSettings = pgTable('acquisition_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
