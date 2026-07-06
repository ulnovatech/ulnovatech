'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type BudgetProvider = {
  provider: string;
  used: number;
  cap: number;
  remaining: number;
};

type FailedJob = {
  id: string;
  runId: string;
  stage: string;
  errorMessage: string | null;
  attempts: number;
  failedAt: string;
  run: { industry: string; city: string; country: string; status: string };
};

type FailedJobsResponse = {
  days: number;
  count: number;
  jobs: FailedJob[];
};

type RevenueOpsMetrics = {
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
  topDiscoveryRuns: Array<{
    runId: string;
    industry: string;
    city: string;
    country: string;
    revenue: number;
    dealCount: number;
  }>;
  topLossReasons: Array<{ reason: string; count: number }>;
  recentRevenue: Array<{
    id: string;
    amount: number;
    closedAt: string;
    businessName: string;
    source: string;
    leadId: string | null;
  }>;
  winLossBySource: Array<{
    channel: 'demand' | 'discovery';
    won: number;
    lost: number;
    winRate: number | null;
  }>;
  recentLosses: Array<{
    leadId: string;
    businessName: string;
    source: string;
    reason: string;
    lostAt: string;
  }>;
};

type OpsMetrics = {
  generatedAt: string;
  funnel: Record<string, number>;
  reviewQueue: { verified: number; unverified: number; total: number };
  demandInboxOpen: number;
  budget: {
    providers: BudgetProvider[];
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
  kpis: Array<{
    id: string;
    label: string;
    target: string;
    measurement: string;
    value: number | string | null;
  }>;
  revenue: RevenueOpsMetrics;
};

function formatMoney(amount: number) {
  return `$${amount.toLocaleString()}`;
}

function formatSourceLabel(source: string) {
  return source === 'demand_inbox' ? 'Demand inbox' : 'Discovery';
}

function formatChannelLabel(channel: 'demand' | 'discovery') {
  return channel === 'demand' ? 'Demand inbox' : 'Discovery runs';
}

const FUNNEL_ORDER = [
  'NEW',
  'REVIEWED',
  'CONTACTED',
  'REPLIED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
  'NO_RESPONSE',
  'NOT_INTERESTED',
  'ARCHIVED',
];

export default function OpsDashboardPage() {
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJobsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    Promise.all([
      api<OpsMetrics>('/api/ops/metrics'),
      api<FailedJobsResponse>('/api/ops/failed-jobs?days=7'),
    ])
      .then(([m, fj]) => {
        setMetrics(m);
        setFailedJobs(fj);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load metrics'));

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return <p className="text-red-700">{error}</p>;
  }

  if (!metrics) {
    return <p className="text-slate-500">Loading ops dashboard…</p>;
  }

  const funnelTotal = Object.values(metrics.funnel).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title={PAGE_COPY.ops.title}
        description={`${PAGE_COPY.ops.description} Updated ${new Date(metrics.generatedAt).toLocaleString()}.`}
      />

      {metrics.budget.workerStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-950">
          Worker heartbeat is stale — start <code className="bg-amber-100 px-1 rounded">pnpm jobs:worker</code>{' '}
          so discovery runs complete.
        </div>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-slate-900">Revenue proof</h3>
          <Link href="/revenue" className="text-xs text-brand-700 hover:underline">
            Close deals →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-xs text-emerald-800">MTD revenue</p>
            <p className="text-2xl font-semibold text-emerald-950">
              {formatMoney(metrics.revenue.mtd)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">All-time revenue</p>
            <p className="text-2xl font-semibold">{formatMoney(metrics.revenue.allTime)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{metrics.revenue.dealCount} deal(s)</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">Pipeline value</p>
            <p className="text-2xl font-semibold">{formatMoney(metrics.revenue.pipelineValue)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {metrics.revenue.pipelineDeals} PROPOSAL_SENT
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">Win rate</p>
            <p className="text-2xl font-semibold">
              {metrics.revenue.winRate != null ? `${metrics.revenue.winRate}%` : '—'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {metrics.revenue.closedWon}W / {metrics.revenue.closedLost}L
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">Avg deal size</p>
            <p className="text-2xl font-semibold">
              {metrics.revenue.avgDealSize != null
                ? formatMoney(metrics.revenue.avgDealSize)
                : '—'}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs text-slate-500">Open proposals</p>
            <p className="text-2xl font-semibold">{metrics.revenue.pursuitsProposalSent}</p>
            <Link href="/proposals" className="text-[10px] text-brand-700 hover:underline">
              View proposals →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Revenue by source</h4>
            <ul className="text-sm space-y-2 text-slate-700">
              <li className="flex justify-between gap-2">
                <span>Discovery runs</span>
                <span className="font-medium">
                  {formatMoney(metrics.revenue.discovery.revenue)}{' '}
                  <span className="text-slate-500 font-normal">
                    ({metrics.revenue.discovery.dealCount} deals)
                  </span>
                </span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Demand inbox</span>
                <span className="font-medium">
                  {formatMoney(metrics.revenue.demand.revenue)}{' '}
                  <span className="text-slate-500 font-normal">
                    ({metrics.revenue.demand.dealCount} deals)
                  </span>
                </span>
              </li>
            </ul>
            {metrics.revenue.topDiscoveryRuns.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Top discovery runs
                </p>
                <ul className="text-sm space-y-1.5">
                  {metrics.revenue.topDiscoveryRuns.map((run) => (
                    <li key={run.runId} className="flex justify-between gap-2">
                      <Link
                        href={`/discovery/${run.runId}`}
                        className="text-brand-700 hover:underline truncate"
                      >
                        {run.industry} · {run.city}
                      </Link>
                      <span className="shrink-0 font-medium">
                        {formatMoney(run.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
            {metrics.revenue.recentRevenue.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">Recent closed revenue</h4>
                <ul className="text-sm space-y-2">
                  {metrics.revenue.recentRevenue.map((r) => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span className="truncate">
                        {r.leadId ? (
                          <Link
                            href={`/leads/${r.leadId}`}
                            className="text-brand-700 hover:underline"
                          >
                            {r.businessName}
                          </Link>
                        ) : (
                          r.businessName
                        )}
                        <span className="text-slate-500 text-xs ml-1">· {r.source}</span>
                      </span>
                      <span className="font-medium shrink-0">{formatMoney(r.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No closed revenue yet — north-star metric for v1.
              </p>
            )}

          </div>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">Win/loss summary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Learn what to hunt more of — compare demand vs discovery close rates.
            </p>
          </div>
          <Link href="/leads" className="text-xs text-brand-700 hover:underline">
            Pursuits →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {metrics.revenue.winLossBySource.map((row) => (
            <div
              key={row.channel}
              className={`rounded-lg p-4 border ${
                row.channel === 'demand'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <p className="text-xs text-slate-600">{formatChannelLabel(row.channel)}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                {row.winRate != null ? `${row.winRate}%` : '—'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {row.won}W / {row.lost}L closed
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Recent losses</h4>
            {metrics.revenue.recentLosses.length > 0 ? (
              <ul className="text-sm space-y-2">
                {metrics.revenue.recentLosses.map((loss) => (
                  <li key={`${loss.leadId}-${loss.lostAt}`} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div className="flex justify-between gap-2">
                      <Link
                        href={`/leads/${loss.leadId}`}
                        className="text-brand-700 hover:underline truncate font-medium"
                      >
                        {loss.businessName}
                      </Link>
                      <span className="text-slate-500 text-xs shrink-0">
                        {formatSourceLabel(loss.source)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-0.5 truncate">{loss.reason}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No closed losses yet — record reasons when marking pursuits CLOSED_LOST.
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Top loss reasons</h4>
            {metrics.revenue.topLossReasons.length > 0 ? (
              <ul className="text-sm space-y-1 text-slate-700">
                {metrics.revenue.topLossReasons.map((row) => (
                  <li key={row.reason} className="flex justify-between gap-2">
                    <span className="truncate">{row.reason}</span>
                    <span className="text-slate-500 shrink-0">{row.count}×</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">
                Loss reasons appear when you close pursuits with a note.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-3">Acquisition KPIs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">{kpi.label}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{kpi.value ?? '—'}</p>
              <p className="text-xs text-slate-600 mt-1">Target: {kpi.target}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Work queue backlog</p>
          <p className="text-2xl font-semibold">
            {metrics.demandInboxOpen + metrics.reviewQueue.total}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {metrics.demandInboxOpen} demand · {metrics.reviewQueue.verified} verified ·{' '}
            {metrics.reviewQueue.unverified} unverified
          </p>
          <Link href="/review" className="text-xs text-brand-700 hover:underline">
            Open work queue →
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Verified opportunities</p>
          <p className="text-2xl font-semibold">{metrics.reviewQueue.verified}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Hot demand (open)</p>
          <p className="text-2xl font-semibold">{metrics.demandInboxOpen}</p>
          <Link href="/intent/inbox" className="text-xs text-brand-700 hover:underline">
            Demand inbox →
          </Link>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Pursuits (funnel)</p>
          <p className="text-2xl font-semibold">{funnelTotal}</p>
          <Link href="/leads" className="text-xs text-brand-700 hover:underline">
            View pursuits →
          </Link>
        </div>
        <div className="bg-white border border-red-100 rounded-lg p-4">
          <p className="text-xs text-slate-500">Failed jobs (7d)</p>
          <p className="text-2xl font-semibold text-red-800">{failedJobs?.count ?? '—'}</p>
          <Link
            href="/discovery?status=failed"
            className="text-xs text-brand-700 hover:underline"
          >
            Failed runs →
          </Link>
        </div>
      </div>

      {failedJobs && failedJobs.jobs.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-3">
            Recent failed pipeline jobs ({failedJobs.days}d)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Stage</th>
                  <th className="py-2 pr-4">Run</th>
                  <th className="py-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {failedJobs.jobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                      {new Date(job.failedAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{job.stage}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/discovery/${job.runId}`}
                        className="text-brand-700 hover:underline"
                      >
                        {job.run.industry} · {job.run.city}
                      </Link>
                    </td>
                    <td className="py-2 text-red-800 text-xs max-w-md truncate">
                      {job.errorMessage ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h3 className="font-semibold text-slate-900 mb-3">
          Pursuit funnel ({funnelTotal} total)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {FUNNEL_ORDER.filter((s) => metrics.funnel[s] != null).map((status) => (
                <tr key={status} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-4 font-medium">{status}</td>
                  <td className="py-2">{metrics.funnel[status]}</td>
                </tr>
              ))}
              {Object.entries(metrics.funnel)
                .filter(([s]) => !FUNNEL_ORDER.includes(s))
                .map(([status, count]) => (
                  <tr key={status} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium">{status}</td>
                    <td className="py-2">{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-3">
            Discovery ({metrics.discovery.windowDays}d)
          </h3>
          <ul className="text-sm space-y-1 text-slate-700">
            <li>Runs started: {metrics.discovery.started}</li>
            <li>Completed: {metrics.discovery.completed}</li>
            <li>Failed: {metrics.discovery.failed}</li>
            <li>
              Success rate:{' '}
              {metrics.discovery.successRate != null ? `${metrics.discovery.successRate}%` : '—'}
            </li>
            <li>
              Avg businesses / completed run:{' '}
              {metrics.discovery.avgBusinessesPerCompletedRun ?? '—'}
            </li>
          </ul>
          <Link href="/discovery" className="text-xs text-brand-700 hover:underline mt-2 inline-block">
            Discovery runs →
          </Link>
        </section>

        <section className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold text-slate-900 mb-3">
            Budget ({metrics.budget.acquisitionMode})
          </h3>
          <ul className="text-sm space-y-2">
            {metrics.budget.providers.map((p) => (
              <li key={p.provider} className="flex justify-between gap-2">
                <span className="text-slate-700">{p.provider}</span>
                <span className="font-mono text-slate-900">
                  {p.used}/{p.cap}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-3">
            Worker last seen:{' '}
            {metrics.budget.workerLastSeenAt
              ? new Date(metrics.budget.workerLastSeenAt).toLocaleString()
              : 'never'}
          </p>
        </section>
      </div>
    </div>
  );
}
