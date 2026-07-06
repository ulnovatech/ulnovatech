import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  canonicalName: varchar('canonical_name', { length: 300 }).notNull(),
  normalizedKey: varchar('normalized_key', { length: 255 }).notNull().unique(),
  source: varchar('source', { length: 50 }).notNull(),
  externalId: varchar('external_id', { length: 255 }),
  website: varchar('website', { length: 500 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  industry: varchar('industry', { length: 200 }),
  sourceUrl: varchar('source_url', { length: 1000 }),
  googleMapsUrl: varchar('google_maps_url', { length: 1000 }),
  facebookUrl: varchar('facebook_url', { length: 1000 }),
  instagramUrl: varchar('instagram_url', { length: 1000 }),
  rating: real('rating'),
  reviewCount: integer('review_count'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  suppressed: boolean('suppressed').notNull().default(false),
  reviewSnoozedUntil: timestamp('review_snoozed_until', { withTimezone: true }),
  lastEnrichedAt: timestamp('last_enriched_at', { withTimezone: true }),
  lastPlacesFetchAt: timestamp('last_places_fetch_at', { withTimezone: true }),
  lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
  crawlStatus: varchar('crawl_status', { length: 30 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const accountMergeLog = pgTable('account_merge_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  survivorId: uuid('survivor_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  mergedId: uuid('merged_id').notNull(),
  mergedNormalizedKey: varchar('merged_normalized_key', { length: 255 }),
  operatorId: varchar('operator_id', { length: 100 }),
  matchKinds: jsonb('match_kinds').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const suppressionList = pgTable('suppression_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  domain: varchar('domain', { length: 255 }),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
