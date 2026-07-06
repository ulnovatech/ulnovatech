import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const mhScans = pgTable('mh_scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  stats: jsonb('stats').$type<Record<string, unknown>>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mhScanJobs = pgTable('mh_scan_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id')
    .notNull()
    .references(() => mhScans.id, { onDelete: 'cascade' }),
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

export const mhListings = pgTable('mh_listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id')
    .notNull()
    .references(() => mhScans.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(),
  listingKey: varchar('listing_key', { length: 500 }).notNull(),
  rawPayload: jsonb('raw_payload').$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mhActionCards = pgTable('mh_action_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id')
    .notNull()
    .references(() => mhScans.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  card: jsonb('card').$type<Record<string, unknown>>().notNull(),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mhSpendLedger = pgTable('mh_spend_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').references(() => mhScans.id, { onDelete: 'set null' }),
  provider: varchar('provider', { length: 50 }).notNull(),
  operation: varchar('operation', { length: 100 }).notNull(),
  costUsd: numeric('cost_usd', { precision: 10, scale: 6 }).notNull().default('0'),
  units: integer('units').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
