import {
  BudgetGovernor,
  getWorkerHeartbeat,
  isWorkerHeartbeatStale,
} from '@agency/acquisition';
import { getDb } from '@agency/database';
import { DEMAND_INGEST_RUN_ID } from '@agency/intent';
import { prospectVerifiedSql } from '@agency/qualification';
import { OPERATING_KPI_TARGETS, platformSettings } from '@agency/settings';
import { sql } from 'drizzle-orm';
import { formatPercent, formatRateLabel } from './metrics-format';
import { loadRevenueMetrics, type RevenueOpsMetrics } from './revenue-metrics';

const WINDOW_DAYS = 7;

export type OpsKpiRow = {
  id: string;
  label: string;
  target: string;
  measurement: string;
  value: number | string | null;
};

export type OpsMetrics = {
  generatedAt: string;
  funnel: Record<string, number>;
  reviewQueue: { verified: number; unverified: number; total: number };
  demandInboxOpen: number;
  budget: {
    providers: Awaited<ReturnType<BudgetGovernor['getSummary']>>;
    acquisitionMode: string;
    workerLastSeenAt: string | null;
    workerStale: boolean;
  };
  discovery: {
    windowDays: number;
    completed: number;
    failed: number;
    started: number;
    successRate: number | null;
    avgBusinessesPerCompletedRun: number | null;
  };
  kpis: OpsKpiRow[];
  revenue: RevenueOpsMetrics;
};

export class OpsMetricsService {
  private governor = new BudgetGovernor();

  async getMetrics(): Promise<OpsMetrics> {
    await platformSettings.ensureLoaded();
    const db = getDb();

    const [funnelRows, reviewRow, demandOpen, discoveryRow, kpiRaw, revenue] = await Promise.all([
      db.execute<{ status: string; count: string }>(sql`
        SELECT status, COUNT(*)::text AS count
        FROM leads
        GROUP BY status
      `),
      db.execute<{ verified: string; unverified: string }>(sql`
        WITH ranked AS (
          SELECT
            a.id AS account_id,
            (${prospectVerifiedSql}) AS verified,
            ROW_NUMBER() OVER (
              PARTITION BY a.id
              ORDER BY COALESCE(ls.score, 0) DESC NULLS LAST
            ) AS rn
          FROM businesses b
          INNER JOIN accounts a ON b.account_id = a.id
          LEFT JOIN lead_scores ls ON ls.business_id = b.id
          WHERE NOT EXISTS (SELECT 1 FROM leads l WHERE l.account_id = a.id)
            AND a.suppressed = false
            AND (a.review_snoozed_until IS NULL OR a.review_snoozed_until <= NOW())
        )
        SELECT
          COUNT(*) FILTER (WHERE verified)::text AS verified,
          COUNT(*) FILTER (WHERE NOT verified)::text AS unverified
        FROM ranked
        WHERE rn = 1
      `),
      db.execute<{ count: string }>(sql`
        SELECT COUNT(*)::text AS count
        FROM intent_signals
        WHERE signal_class = 'demand'
          AND business_id IS NULL
          AND dismissed_at IS NULL
      `),
      db.execute<{
        completed: string;
        failed: string;
        started: string;
        avg_businesses: string | null;
      }>(sql`
        WITH runs AS (
          SELECT id, status
          FROM discovery_runs
          WHERE created_at >= NOW() - INTERVAL '7 days'
            AND id != ${DEMAND_INGEST_RUN_ID}
        ),
        biz AS (
          SELECT b.discovery_run_id, COUNT(*)::int AS cnt
          FROM businesses b
          INNER JOIN runs r ON r.id = b.discovery_run_id
          WHERE r.status = 'completed'
          GROUP BY b.discovery_run_id
        )
        SELECT
          (SELECT COUNT(*)::text FROM runs WHERE status = 'completed') AS completed,
          (SELECT COUNT(*)::text FROM runs WHERE status = 'failed') AS failed,
          (SELECT COUNT(*)::text FROM runs) AS started,
          (SELECT ROUND(AVG(cnt)::numeric, 1)::text FROM biz) AS avg_businesses
      `),
      this.loadKpiValues(db),
      loadRevenueMetrics(db),
    ]);

    const funnel: Record<string, number> = {};
    for (const row of funnelRows) {
      funnel[row.status] = parseInt(row.count, 10);
    }

    const verified = parseInt(reviewRow[0]?.verified ?? '0', 10);
    const unverified = parseInt(reviewRow[0]?.unverified ?? '0', 10);

    const completed = parseInt(discoveryRow[0]?.completed ?? '0', 10);
    const failed = parseInt(discoveryRow[0]?.failed ?? '0', 10);
    const started = parseInt(discoveryRow[0]?.started ?? '0', 10);
    const finished = completed + failed;
    const avgRaw = discoveryRow[0]?.avg_businesses;

    const providers = await this.governor.getSummary();
    const heartbeat = await getWorkerHeartbeat();

    const kpis = OPERATING_KPI_TARGETS.map((kpi) => ({
      ...kpi,
      value: kpiRaw[kpi.id] ?? null,
    }));

    return {
      generatedAt: new Date().toISOString(),
      funnel,
      reviewQueue: { verified, unverified, total: verified + unverified },
      demandInboxOpen: parseInt(demandOpen[0]?.count ?? '0', 10),
      budget: {
        providers,
        acquisitionMode: platformSettings.getAcquisitionMode(),
        workerLastSeenAt: heartbeat?.at ?? null,
        workerStale: isWorkerHeartbeatStale(heartbeat),
      },
      discovery: {
        windowDays: WINDOW_DAYS,
        completed,
        failed,
        started,
        successRate: formatPercent(completed, finished),
        avgBusinessesPerCompletedRun: avgRaw != null ? parseFloat(avgRaw) : null,
      },
      kpis,
      revenue,
    };
  }

  private async loadKpiValues(db: ReturnType<typeof getDb>) {
    const [reachable, promoted, contacted, duplicate, demandActioned] = await Promise.all([
      db.execute<{ count: string }>(sql`
        SELECT COUNT(DISTINCT l.id)::text AS count
        FROM leads l
        INNER JOIN businesses b ON l.business_id = b.id
        LEFT JOIN lead_scores ls ON ls.business_id = b.id
        WHERE l.created_at >= NOW() - INTERVAL '7 days'
          AND l.status != 'NEW'
          AND COALESCE(ls.reachability, 'none') IN ('medium', 'high')
      `),
      db.execute<{ count: string }>(sql`
        SELECT COUNT(*)::text AS count
        FROM leads
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND status != 'NEW'
      `),
      db.execute<{ count: string }>(sql`
        SELECT COUNT(*)::text AS count
        FROM leads
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND status IN (
            'CONTACTED', 'REPLIED', 'QUALIFIED', 'PROPOSAL_SENT',
            'CLOSED_WON', 'CLOSED_LOST', 'NO_RESPONSE', 'NOT_INTERESTED'
          )
      `),
      db.execute<{ count: string }>(sql`
        SELECT COUNT(*)::text AS count
        FROM (
          SELECT l.account_id
          FROM outreach_messages om
          INNER JOIN leads l ON l.id = om.lead_id
          WHERE om.sent_at >= NOW() - INTERVAL '30 days'
          GROUP BY l.account_id
          HAVING COUNT(*) > 1
        ) dup
      `),
      db.execute<{ count: string }>(sql`
        SELECT (
          (SELECT COUNT(*) FROM intent_signals
           WHERE signal_class = 'demand'
             AND dismissed_at >= NOW() - INTERVAL '7 days')
          +
          (SELECT COUNT(*) FROM intent_signals isig
           INNER JOIN businesses b ON isig.business_id = b.id
           WHERE isig.signal_class = 'demand'
             AND b.source = 'demand_inbox'
             AND b.created_at >= NOW() - INTERVAL '7 days')
        )::text AS count
      `),
    ]);

    const promotedCount = parseInt(promoted[0]?.count ?? '0', 10);
    const contactedCount = parseInt(contacted[0]?.count ?? '0', 10);
    const dupCount = parseInt(duplicate[0]?.count ?? '0', 10);
    const totalOutreachAccounts = await db.execute<{ count: string }>(sql`
      SELECT COUNT(DISTINCT l.account_id)::text AS count
      FROM outreach_messages om
      INNER JOIN leads l ON l.id = om.lead_id
      WHERE om.sent_at >= NOW() - INTERVAL '30 days'
    `);
    const outreachAccounts = parseInt(totalOutreachAccounts[0]?.count ?? '0', 10);
    const duplicateRate = formatPercent(dupCount, outreachAccounts);

    const discoveryRow = await db.execute<{ completed: string; failed: string }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed')::text AS completed,
        COUNT(*) FILTER (WHERE status = 'failed')::text AS failed
      FROM discovery_runs
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND id != ${DEMAND_INGEST_RUN_ID}
    `);
    const discCompleted = parseInt(discoveryRow[0]?.completed ?? '0', 10);
    const discFailed = parseInt(discoveryRow[0]?.failed ?? '0', 10);
    const discoveryRate = formatPercent(discCompleted, discCompleted + discFailed);

    const places = (await this.governor.getSummary()).find((p) => p.provider === 'google_places');

    return {
      reachable_leads_week: parseInt(reachable[0]?.count ?? '0', 10),
      review_to_contacted: formatRateLabel(formatPercent(contactedCount, promotedCount)),
      duplicate_outreach: duplicateRate != null ? `${duplicateRate}%` : '—',
      places_spend_month: places ? `${places.used}/${places.cap}` : '—',
      discovery_success_rate: formatRateLabel(discoveryRate),
      demand_actioned_week: parseInt(demandActioned[0]?.count ?? '0', 10),
    } as Record<string, number | string | null>;
  }
}
