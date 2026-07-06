'use client';



import { canPromoteFromReview } from '@agency/qualification/review-verification';

import type { OpportunityType } from '@agency/scoring';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';

import {

  defaultDemandDraft,

  DemandWorkCard,

  type DemandProspectDraft,

} from '@/components/opportunities/demand-work-card';

import { OpportunityCard } from '@/components/opportunities/opportunity-card';

import { api } from '@/lib/api';

import { PAGE_COPY } from '@/lib/product-copy';



type Reachability = 'high' | 'medium' | 'low' | 'none';

type VerificationFilter = 'verified' | 'unverified' | 'all';

type KindFilter = 'all' | 'demand' | 'opportunity';



type WorkQueueDemand = {

  kind: 'demand';

  priority: number;

  tier: 'demand';

  tierLabel: string;

  demand: {

    id: string;

    source: string;

    signalType: string;

    signalStrength: number;

    title: string | null;

    snippet: string | null;

    sourceUrl: string | null;

    capturedAt: string;

  };

};



type WorkQueueOpportunity = {

  kind: 'opportunity';

  priority: number;

  tier: 'verified_opportunity' | 'unverified_opportunity';

  tierLabel: string;

  opportunity: Parameters<typeof OpportunityCard>[0]['item'] & {

    factors: Record<string, number>;

  };

};



type WorkQueueEntry = WorkQueueDemand | WorkQueueOpportunity;



type WorkQueueResponse = {

  items: WorkQueueEntry[];

  total: number;

  page: number;

  limit: number;

  counts: {

    demand: number;

    opportunity: number;

    verifiedOpportunity: number;

    unverifiedOpportunity: number;

  };

};



const REACHABILITY_ORDER: Reachability[] = ['high', 'medium', 'low', 'none'];



export default function WorkQueuePage() {

  const [entries, setEntries] = useState<WorkQueueEntry[]>([]);

  const [counts, setCounts] = useState<WorkQueueResponse['counts'] | null>(null);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [demandDrafts, setDemandDrafts] = useState<Record<string, DemandProspectDraft>>({});

  const [filters, setFilters] = useState({

    kind: 'all' as KindFilter,

    minScore: '',

    reachability: '' as '' | Reachability,

    runId: '',

    verification: 'all' as VerificationFilter,

    opportunityType: '' as '' | OpportunityType,

  });

  const limit = 20;

  const router = useRouter();



  const load = useCallback(() => {

    const params = new URLSearchParams({

      page: String(page),

      limit: String(limit),

      kind: filters.kind,

      verification: filters.verification,

    });

    if (filters.minScore) params.set('minScore', filters.minScore);

    if (filters.reachability) params.set('reachability', filters.reachability);

    if (filters.runId) params.set('runId', filters.runId);

    if (filters.opportunityType) params.set('opportunityType', filters.opportunityType);



    return api<WorkQueueResponse>(`/api/qualification/work-queue?${params}`).then((d) => {

      setEntries(d.items);

      setTotal(d.total);

      setCounts(d.counts);

      setDemandDrafts((prev) => {

        const next = { ...prev };

        for (const entry of d.items) {

          if (entry.kind === 'demand' && !next[entry.demand.id]) {

            next[entry.demand.id] = defaultDemandDraft(entry.demand);

          }

        }

        return next;

      });

    });

  }, [page, filters]);



  useEffect(() => {

    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load work queue'));

  }, [load]);



  const accept = async (item: WorkQueueOpportunity['opportunity']) => {

    const promote = canPromoteFromReview({

      verified: item.verified,

      reachability: item.reachability,

      hasEmail: !!item.business.email,

      hasPhone: !!item.business.phone,

    });

    if (!promote.allowed) {

      alert(promote.reason);

      return;

    }



    setLoading(item.business.id);

    setError(null);

    try {

      const { lead } = await api<{ lead: { id: string } }>('/api/crm/leads', {

        method: 'POST',

        body: JSON.stringify({ businessId: item.business.id, promoteOnly: true }),

      });

      await load();

      router.push(`/leads/${lead.id}`);

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Start pursuit failed');

    } finally {

      setLoading(null);

    }

  };



  const dismissOpportunity = async (accountId: string) => {

    setLoading(accountId);

    setError(null);

    try {

      await api(`/api/qualification/review-queue/${accountId}/dismiss`, { method: 'POST' });

      await load();

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Dismiss failed');

    } finally {

      setLoading(null);

    }

  };



  const rejectOpportunity = async (accountId: string) => {

    if (!confirm('Suppress this account? It will not appear in future queues.')) return;

    setLoading(accountId);

    setError(null);

    try {

      await api(`/api/qualification/review-queue/${accountId}/reject`, {

        method: 'POST',

        body: JSON.stringify({ reason: 'Rejected from work queue' }),

      });

      await load();

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Reject failed');

    } finally {

      setLoading(null);

    }

  };



  const dismissDemand = async (signalId: string) => {

    setLoading(signalId);

    setError(null);

    try {

      await api(`/api/intent/demand-inbox/${signalId}/dismiss`, { method: 'POST' });

      await load();

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Dismiss failed');

    } finally {

      setLoading(null);

    }

  };



  const createProspect = async (signalId: string) => {

    const draft = demandDrafts[signalId];

    if (!draft?.name.trim()) {

      setError('Business name is required to create a prospect');

      return;

    }

    setLoading(`create-${signalId}`);

    setError(null);

    try {

      const result = await api<{ businessId: string }>(

        `/api/intent/demand-inbox/${signalId}/create-prospect`,

        {

          method: 'POST',

          body: JSON.stringify({

            name: draft.name.trim(),

            city: draft.city.trim() || undefined,

            country: draft.country.trim() || undefined,

            industry: draft.industry.trim() || undefined,

          }),

        },

      );

      await load();

      if (result.businessId) {

        router.refresh();

      }

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Create prospect failed');

    } finally {

      setLoading(null);

    }

  };



  const matchDemand = async (signalId: string) => {

    const businessId = demandDrafts[signalId]?.businessId.trim();

    if (!businessId) {

      setError('Business ID is required to match');

      return;

    }

    setLoading(`match-${signalId}`);

    setError(null);

    try {

      await api(`/api/intent/demand-inbox/${signalId}/match`, {

        method: 'POST',

        body: JSON.stringify({ businessId }),

      });

      await load();

    } catch (e) {

      setError(e instanceof Error ? e.message : 'Match failed');

    } finally {

      setLoading(null);

    }

  };



  const totalPages = Math.max(1, Math.ceil(total / limit));



  return (

    <div className="max-w-5xl">

      <div className="flex flex-wrap items-start justify-between gap-2">

        <PageHeader

          title={PAGE_COPY.workQueue.title}

          description={PAGE_COPY.workQueue.description}

        />

        <Link href="/intent/inbox" className="text-sm text-brand-700 hover:underline shrink-0">

          Demand inbox only →

        </Link>

      </div>



      {error && (

        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">

          {error}

        </p>

      )}



      {counts && (

        <div className="mb-4 flex flex-wrap gap-2 text-xs">

          <span className="px-2 py-1 rounded bg-amber-100 text-amber-900">

            {counts.demand} hot demand

          </span>

          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-900">

            {counts.verifiedOpportunity} verified

          </span>

          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700">

            {counts.unverifiedOpportunity} unverified

          </span>

        </div>

      )}



      <div className="mb-6 grid grid-cols-1 sm:grid-cols-6 gap-3 bg-white border rounded-lg p-4">

        <label className="text-sm block">

          <span className="text-slate-600">Show</span>

          <select

            className="mt-1 w-full border border-slate-300 rounded px-2 py-1"

            value={filters.kind}

            onChange={(e) => {

              setPage(1);

              setFilters({ ...filters, kind: e.target.value as KindFilter });

            }}

          >

            <option value="all">All (priority sorted)</option>

            <option value="demand">Hot demand only</option>

            <option value="opportunity">Opportunities only</option>

          </select>

        </label>

        <label className="text-sm block">

          <span className="text-slate-600">Verification</span>

          <select

            className="mt-1 w-full border border-slate-300 rounded px-2 py-1"

            value={filters.verification}

            onChange={(e) => {

              setPage(1);

              setFilters({ ...filters, verification: e.target.value as VerificationFilter });

            }}

          >

            <option value="all">All</option>

            <option value="verified">Verified only</option>

            <option value="unverified">Unverified only</option>

          </select>

        </label>

        <label className="text-sm block">

          <span className="text-slate-600">Opportunity type</span>

          <select

            className="mt-1 w-full border border-slate-300 rounded px-2 py-1"

            value={filters.opportunityType}

            onChange={(e) => {

              setPage(1);

              setFilters({

                ...filters,

                opportunityType: e.target.value as '' | OpportunityType,

              });

            }}

          >

            <option value="">All types</option>

            <option value="demand_response">Demand response</option>

            <option value="greenfield">Greenfield site</option>

            <option value="redesign">Redesign</option>

            <option value="modernize">Modernize</option>

            <option value="general">General fit</option>

          </select>

        </label>

        <label className="text-sm block">

          <span className="text-slate-600">Min score</span>

          <input

            type="number"

            min={0}

            max={100}

            className="mt-1 w-full border border-slate-300 rounded px-2 py-1"

            value={filters.minScore}

            onChange={(e) => {

              setPage(1);

              setFilters({ ...filters, minScore: e.target.value });

            }}

          />

        </label>

        <label className="text-sm block">

          <span className="text-slate-600">Reachability</span>

          <select

            className="mt-1 w-full border border-slate-300 rounded px-2 py-1"

            value={filters.reachability}

            onChange={(e) => {

              setPage(1);

              setFilters({ ...filters, reachability: e.target.value as '' | Reachability });

            }}

          >

            <option value="">All</option>

            {REACHABILITY_ORDER.map((level) => (

              <option key={level} value={level}>

                {level.charAt(0).toUpperCase() + level.slice(1)}

              </option>

            ))}

          </select>

        </label>

        <label className="text-sm block">

          <span className="text-slate-600">Run ID</span>

          <input

            className="mt-1 w-full border border-slate-300 rounded px-2 py-1 font-mono text-xs"

            placeholder="Optional UUID"

            value={filters.runId}

            onChange={(e) => {

              setPage(1);

              setFilters({ ...filters, runId: e.target.value });

            }}

          />

        </label>

      </div>



      <p className="text-sm text-slate-500 mb-4">

        {total} item{total === 1 ? '' : 's'} · page {page} of {totalPages}

      </p>



      <div className="space-y-4">

        {entries.map((entry) => {

          if (entry.kind === 'demand') {

            const draft = demandDrafts[entry.demand.id] ?? defaultDemandDraft(entry.demand);

            const busy =

              loading === entry.demand.id ||

              loading === `create-${entry.demand.id}` ||

              loading === `match-${entry.demand.id}`;



            return (

              <DemandWorkCard

                key={`demand-${entry.demand.id}`}

                item={entry.demand}

                tierLabel={entry.tierLabel}

                priority={entry.priority}

                draft={draft}

                loading={busy}

                onDraftChange={(d) =>

                  setDemandDrafts((prev) => ({ ...prev, [entry.demand.id]: d }))

                }

                onCreateProspect={() => createProspect(entry.demand.id)}

                onMatch={() => matchDemand(entry.demand.id)}

                onDismiss={() => dismissDemand(entry.demand.id)}

              />

            );

          }



          const item = entry.opportunity;

          const promote = canPromoteFromReview({

            verified: item.verified,

            reachability: item.reachability,

            hasEmail: !!item.business.email,

            hasPhone: !!item.business.phone,

          });

          const busy =

            loading === item.business.id || loading === item.account.id;



          return (

            <OpportunityCard

              key={`opp-${item.account.id}`}

              item={item}

              tierLabel={entry.tierLabel}

              priority={entry.priority}

              promoteAllowed={promote.allowed}

              promoteBlocked={promote.allowed ? undefined : promote.reason}

              loading={busy}

              onStartPursuit={() => accept(item)}

              onDismiss={() => dismissOpportunity(item.account.id)}

              onReject={() => rejectOpportunity(item.account.id)}

            />

          );

        })}



        {entries.length === 0 && (

          <p className="text-slate-500 text-center py-12">

            Work queue is clear. Run discovery or{' '}

            <Link href="/intent" className="text-brand-700 hover:underline">

              add demand

            </Link>

            .

          </p>

        )}

      </div>



      {totalPages > 1 && (

        <div className="flex justify-center gap-2 mt-6">

          <button

            type="button"

            disabled={page <= 1}

            onClick={() => setPage((p) => Math.max(1, p - 1))}

            className="px-3 py-1 border rounded disabled:opacity-50"

          >

            Previous

          </button>

          <button

            type="button"

            disabled={page >= totalPages}

            onClick={() => setPage((p) => p + 1)}

            className="px-3 py-1 border rounded disabled:opacity-50"

          >

            Next

          </button>

        </div>

      )}

    </div>

  );

}

