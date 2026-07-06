import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';

export const discoveryRuns = pgTable('discovery_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  country: varchar('country', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  industry: varchar('industry', { length: 200 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  runProfile: varchar('run_profile', { length: 20 }).notNull().default('standard'),
  prospectFocus: boolean('prospect_focus').notNull().default(false),
  boiNarrative: boolean('boi_narrative').notNull().default(false),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  stats: jsonb('stats').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'set null' }),
  discoveryRunId: uuid('discovery_run_id')
    .notNull()
    .references(() => discoveryRuns.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 300 }).notNull(),
  industry: varchar('industry', { length: 200 }),
  website: varchar('website', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  source: varchar('source', { length: 50 }).notNull(),
  sourceUrl: varchar('source_url', { length: 1000 }),
  externalId: varchar('external_id', { length: 255 }),
  googleMapsUrl: varchar('google_maps_url', { length: 1000 }),
  facebookUrl: varchar('facebook_url', { length: 1000 }),
  instagramUrl: varchar('instagram_url', { length: 1000 }),
  rating: real('rating'),
  reviewCount: integer('review_count'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
