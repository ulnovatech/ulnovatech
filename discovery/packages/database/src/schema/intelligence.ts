import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { accounts } from './accounts';
import { businesses, discoveryRuns } from './discovery';

export const websiteAnalyses = pgTable('website_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' })
    .unique(),
  hasWebsite: boolean('has_website').notNull().default(false),
  mobileFriendly: boolean('mobile_friendly'),
  httpsEnabled: boolean('https_enabled'),
  performanceScore: integer('performance_score'),
  notes: text('notes'),
  analyzedAt: timestamp('analyzed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const businessIntelligenceProfiles = pgTable('business_intelligence_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' })
    .unique(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'set null' }),
  discoveryRunId: uuid('discovery_run_id').references(() => discoveryRuns.id, {
    onDelete: 'set null',
  }),
  profile: jsonb('profile').$type<Record<string, unknown>>().notNull(),
  completenessScore: integer('completeness_score').notNull().default(0),
  enrichedAt: timestamp('enriched_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
