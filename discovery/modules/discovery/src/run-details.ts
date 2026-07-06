import { getDb, leadScores, websiteAnalyses } from '@agency/database';
import { eq } from 'drizzle-orm';
import { DiscoveryRepository } from './repository';

export async function getRunWithEnrichedBusinesses(runId: string) {
  const repo = new DiscoveryRepository();
  const run = await repo.getRun(runId);
  if (!run) return null;

  const businesses = await repo.listBusinessesByRun(runId);
  const db = getDb();

  const enriched = await Promise.all(
    businesses.map(async (b) => {
      const [analysis] = await db
        .select()
        .from(websiteAnalyses)
        .where(eq(websiteAnalyses.businessId, b.id));
      const [score] = await db
        .select()
        .from(leadScores)
        .where(eq(leadScores.businessId, b.id));
      return {
        ...b,
        analysis: analysis ?? null,
        score: score?.score ?? null,
        scoreFactors: score?.factors ?? null,
      };
    }),
  );

  return { run, businesses: enriched };
}
