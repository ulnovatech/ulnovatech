import { getDb } from '@agency/database';
import { DEMAND_INGEST_RUN_ID } from '@agency/intent';
import { sql } from 'drizzle-orm';
import { formatPercent } from './metrics-format';

export type DiscoveryRunRevenueRow = {
  runId: string;
  industry: string;
  city: string;
  country: string;
  revenue: number;
  dealCount: number;
};

export type LossReasonRow = {
  reason: string;
  count: number;
};

export type RecentRevenueRow = {
  id: string;
  amount: number;
  closedAt: string;
  businessName: string;
  source: string;
  leadId: string | null;
};

export type WinLossBySourceRow = {
  channel: 'demand' | 'discovery';
  won: number;
  lost: number;
  winRate: number | null;
};

export type RecentLossRow = {
  leadId: string;
  businessName: string;
  source: string;
  reason: string;
  lostAt: string;
};

export type RevenueOpsMetrics = {
  mtd: number;
  allTime: number;
  dealCount: number;
  pipelineValue: number;
  pipelineDeals: number;
  pursuitsProposalSent: number;
  winRate: number | null;
  closedWon: number;
  closedLost: number;
  avgDealSize: number | null;
  demand: { revenue: number; dealCount: number };
  discovery: { revenue: number; dealCount: number };
  topDiscoveryRuns: DiscoveryRunRevenueRow[];
  topLossReasons: LossReasonRow[];
  recentRevenue: RecentRevenueRow[];
  winLossBySource: WinLossBySourceRow[];
  recentLosses: RecentLossRow[];
};

export async function loadRevenueMetrics(db: ReturnType<typeof getDb>): Promise<RevenueOpsMetrics> {
  const [
    revenueTotals,
    pipelineRow,
    proposalSentRow,
    winLossRow,
    demandRow,
    discoveryRow,
    topRuns,
    lossReasons,
    recent,
    winLossBySourceRows,
    recentLossRows,
  ] = await Promise.all([
    db.execute<{
      mtd: string;
      all_time: string;
      deal_count: string;
      avg_deal: string | null;
    }>(sql`
      SELECT
        COALESCE(SUM(amount) FILTER (
          WHERE closed_at >= date_trunc('month', NOW())
        ), 0)::text AS mtd,
        COALESCE(SUM(amount), 0)::text AS all_time,
        COUNT(*)::text AS deal_count,
        ROUND(AVG(amount)::numeric, 0)::text AS avg_deal
      FROM revenue_records
    `),
    db.execute<{ pipeline_value: string; pipeline_deals: string }>(sql`
      SELECT
        COALESCE(SUM(p.amount), 0)::text AS pipeline_value,
        COUNT(DISTINCT l.id)::text AS pipeline_deals
      FROM proposals p
      INNER JOIN leads l ON l.id = p.lead_id
      WHERE l.status = 'PROPOSAL_SENT'
        AND p.status = 'sent'
    `),
    db.execute<{ count: string }>(sql`
      SELECT COUNT(*)::text AS count
      FROM leads
      WHERE status = 'PROPOSAL_SENT'
    `),
    db.execute<{ won: string; lost: string }>(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'CLOSED_WON')::text AS won,
        COUNT(*) FILTER (WHERE status = 'CLOSED_LOST')::text AS lost
      FROM leads
      WHERE status IN ('CLOSED_WON', 'CLOSED_LOST')
    `),
    db.execute<{ revenue: string; deal_count: string }>(sql`
      SELECT
        COALESCE(SUM(rr.amount), 0)::text AS revenue,
        COUNT(rr.id)::text AS deal_count
      FROM revenue_records rr
      INNER JOIN leads l ON l.id = rr.lead_id
      INNER JOIN businesses b ON b.id = l.business_id
      WHERE b.source = 'demand_inbox'
    `),
    db.execute<{ revenue: string; deal_count: string }>(sql`
      SELECT
        COALESCE(SUM(rr.amount), 0)::text AS revenue,
        COUNT(rr.id)::text AS deal_count
      FROM revenue_records rr
      INNER JOIN leads l ON l.id = rr.lead_id
      INNER JOIN businesses b ON b.id = l.business_id
      INNER JOIN discovery_runs dr ON dr.id = b.discovery_run_id
      WHERE b.source != 'demand_inbox'
        AND dr.id != ${DEMAND_INGEST_RUN_ID}
    `),
    db.execute<{
      run_id: string;
      industry: string;
      city: string;
      country: string;
      revenue: string;
      deal_count: string;
    }>(sql`
      SELECT
        dr.id AS run_id,
        dr.industry,
        dr.city,
        dr.country,
        COALESCE(SUM(rr.amount), 0)::text AS revenue,
        COUNT(rr.id)::text AS deal_count
      FROM revenue_records rr
      INNER JOIN leads l ON l.id = rr.lead_id
      INNER JOIN businesses b ON b.id = l.business_id
      INNER JOIN discovery_runs dr ON dr.id = b.discovery_run_id
      WHERE dr.id != ${DEMAND_INGEST_RUN_ID}
      GROUP BY dr.id, dr.industry, dr.city, dr.country
      HAVING COUNT(rr.id) > 0
      ORDER BY SUM(rr.amount) DESC
      LIMIT 5
    `),
    db.execute<{ reason: string; count: string }>(sql`
      SELECT
        TRIM(REPLACE(la.description, 'Deal lost: ', '')) AS reason,
        COUNT(*)::text AS count
      FROM lead_activities la
      INNER JOIN leads l ON l.id = la.lead_id
      WHERE la.type = 'closed_lost'
        AND l.status = 'CLOSED_LOST'
      GROUP BY reason
      ORDER BY COUNT(*) DESC
      LIMIT 5
    `),
    db.execute<{
      id: string;
      amount: string;
      closed_at: string;
      business_name: string;
      source: string;
      lead_id: string | null;
    }>(sql`
      SELECT
        rr.id,
        rr.amount::text AS amount,
        rr.closed_at::text AS closed_at,
        b.name AS business_name,
        b.source,
        rr.lead_id
      FROM revenue_records rr
      LEFT JOIN leads l ON l.id = rr.lead_id
      LEFT JOIN businesses b ON b.id = l.business_id
      ORDER BY rr.closed_at DESC
      LIMIT 5
    `),
    db.execute<{ channel: string; won: string; lost: string }>(sql`
      SELECT
        CASE WHEN b.source = 'demand_inbox' THEN 'demand' ELSE 'discovery' END AS channel,
        COUNT(*) FILTER (WHERE l.status = 'CLOSED_WON')::text AS won,
        COUNT(*) FILTER (WHERE l.status = 'CLOSED_LOST')::text AS lost
      FROM leads l
      INNER JOIN businesses b ON b.id = l.business_id
      WHERE l.status IN ('CLOSED_WON', 'CLOSED_LOST')
      GROUP BY channel
    `),
    db.execute<{
      lead_id: string;
      business_name: string;
      source: string;
      reason: string;
      lost_at: string;
    }>(sql`
      SELECT
        l.id AS lead_id,
        b.name AS business_name,
        b.source,
        TRIM(REPLACE(la.description, 'Deal lost: ', '')) AS reason,
        la.created_at::text AS lost_at
      FROM lead_activities la
      INNER JOIN leads l ON l.id = la.lead_id
      INNER JOIN businesses b ON b.id = l.business_id
      WHERE la.type = 'closed_lost'
        AND l.status = 'CLOSED_LOST'
      ORDER BY la.created_at DESC
      LIMIT 5
    `),
  ]);

  const closedWon = parseInt(winLossRow[0]?.won ?? '0', 10);
  const closedLost = parseInt(winLossRow[0]?.lost ?? '0', 10);
  const dealCount = parseInt(revenueTotals[0]?.deal_count ?? '0', 10);
  const avgRaw = revenueTotals[0]?.avg_deal;

  return {
    mtd: parseInt(revenueTotals[0]?.mtd ?? '0', 10),
    allTime: parseInt(revenueTotals[0]?.all_time ?? '0', 10),
    dealCount,
    pipelineValue: parseInt(pipelineRow[0]?.pipeline_value ?? '0', 10),
    pipelineDeals: parseInt(pipelineRow[0]?.pipeline_deals ?? '0', 10),
    pursuitsProposalSent: parseInt(proposalSentRow[0]?.count ?? '0', 10),
    winRate: formatPercent(closedWon, closedWon + closedLost),
    closedWon,
    closedLost,
    avgDealSize: avgRaw != null ? parseInt(avgRaw, 10) : null,
    demand: {
      revenue: parseInt(demandRow[0]?.revenue ?? '0', 10),
      dealCount: parseInt(demandRow[0]?.deal_count ?? '0', 10),
    },
    discovery: {
      revenue: parseInt(discoveryRow[0]?.revenue ?? '0', 10),
      dealCount: parseInt(discoveryRow[0]?.deal_count ?? '0', 10),
    },
    topDiscoveryRuns: topRuns.map((r) => ({
      runId: r.run_id,
      industry: r.industry,
      city: r.city,
      country: r.country,
      revenue: parseInt(r.revenue, 10),
      dealCount: parseInt(r.deal_count, 10),
    })),
    topLossReasons: lossReasons.map((r) => ({
      reason: r.reason,
      count: parseInt(r.count, 10),
    })),
    recentRevenue: recent.map((r) => ({
      id: r.id,
      amount: parseInt(r.amount, 10),
      closedAt: r.closed_at,
      businessName: r.business_name ?? 'Unknown',
      source: r.source ?? '—',
      leadId: r.lead_id,
    })),
    winLossBySource: buildWinLossBySource(winLossBySourceRows),
    recentLosses: recentLossRows.map((r) => ({
      leadId: r.lead_id,
      businessName: r.business_name ?? 'Unknown',
      source: r.source ?? '—',
      reason: r.reason || 'No reason recorded',
      lostAt: r.lost_at,
    })),
  };
}

export function buildWinLossBySource(
  rows: Array<{ channel: string; won: string; lost: string }>,
): WinLossBySourceRow[] {
  const byChannel = new Map<string, { won: number; lost: number }>();
  for (const row of rows) {
    byChannel.set(row.channel, {
      won: parseInt(row.won, 10),
      lost: parseInt(row.lost, 10),
    });
  }

  return (['demand', 'discovery'] as const).map((channel) => {
    const counts = byChannel.get(channel) ?? { won: 0, lost: 0 };
    return {
      channel,
      won: counts.won,
      lost: counts.lost,
      winRate: formatPercent(counts.won, counts.won + counts.lost),
    };
  });
}
