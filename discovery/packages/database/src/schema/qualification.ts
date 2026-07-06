import { integer, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { businesses } from './discovery';

export const leadScores = pgTable('lead_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' })
    .unique(),
  score: integer('score').notNull(),
  reachability: varchar('reachability', { length: 20 }),
  factors: jsonb('factors').$type<Record<string, number>>().notNull().default({}),
  computedAt: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
});
