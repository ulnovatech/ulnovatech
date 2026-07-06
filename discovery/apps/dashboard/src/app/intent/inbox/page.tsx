'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type OrphanSignal = {
  id: string;
  source: string;
  signalType: string;
  signalStrength: number;
  title: string | null;
  snippet: string | null;
  sourceUrl: string | null;
  capturedAt: string;
};

type ProspectDraft = {
  name: string;
  city: string;
  country: string;
  industry: string;
  businessId: string;
};

function defaultDraft(signal: OrphanSignal): ProspectDraft {
  const title = signal.title?.replace(/^\[[^\]]+\]\s*/, '').trim() ?? '';
  return {
    name: title.slice(0, 200),
    city: '',
    country: '',
    industry: '',
    businessId: '',
  };
}

export default function DemandInboxPage() {
  const [items, setItems] = useState<OrphanSignal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ProspectDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const limit = 20;
  const router = useRouter();

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api<{ items: OrphanSignal[]; total: number }>(`/api/intent/demand-inbox?${params}`).then(
      (d) => {
        setItems(d.items);
        setTotal(d.total);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const item of d.items) {
            if (!next[item.id]) next[item.id] = defaultDraft(item);
          }
          return next;
        });
      },
    );
  }, [page]);

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load inbox'));
  }, [load]);

  const dismiss = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await api(`/api/intent/demand-inbox/${id}/dismiss`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dismiss failed');
    } finally {
      setLoading(null);
    }
  };

  const createProspect = async (id: string) => {
    const draft = drafts[id];
    if (!draft?.name.trim()) {
      setError('Business name is required to create a prospect');
      return;
    }
    setLoading(`create-${id}`);
    setError(null);
    try {
      const result = await api<{ businessId: string; reviewUrl: string }>(
        `/api/intent/demand-inbox/${id}/create-prospect`,
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
      router.push(result.reviewUrl ?? '/review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create prospect failed');
    } finally {
      setLoading(null);
    }
  };

  const matchBusiness = async (id: string) => {
    const businessId = drafts[id]?.businessId.trim();
    if (!businessId) {
      setError('Business ID is required to match');
      return;
    }
    setLoading(`match-${id}`);
    setError(null);
    try {
      await api(`/api/intent/demand-inbox/${id}/match`, {
        method: 'POST',
        body: JSON.stringify({ businessId }),
      });
      await load();
      router.push('/review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Match failed');
    } finally {
      setLoading(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageHeader title={PAGE_COPY.demandInbox.title} description={PAGE_COPY.demandInbox.description} />
        <Link href="/intent" className="text-sm text-brand-700 hover:underline shrink-0">
          ← Add demand
        </Link>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}

      <p className="text-sm text-slate-500 mb-4">
        {total} orphan signal{total === 1 ? '' : 's'} · page {page} of {totalPages}
      </p>

      <div className="space-y-4">
        {items.map((item) => {
          const draft = drafts[item.id] ?? defaultDraft(item);
          const busy = loading === item.id || loading === `create-${item.id}` || loading === `match-${item.id}`;

          return (
            <article key={item.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    {item.signalType}
                  </span>
                  <span className="text-xs text-slate-500">{item.source}</span>
                  <span className="text-xs text-slate-500">strength {item.signalStrength}</span>
                </div>
                <h3 className="font-medium text-slate-900">{item.title || 'Untitled signal'}</h3>
                {item.snippet && <p className="text-sm text-slate-600 mt-1 line-clamp-3">{item.snippet}</p>}
                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-700 hover:underline mt-1 inline-block break-all"
                  >
                    {item.sourceUrl}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <input
                  className="border border-slate-300 rounded px-2 py-1"
                  placeholder="Business name"
                  value={draft.name}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [item.id]: { ...draft, name: e.target.value } })
                  }
                />
                <input
                  className="border border-slate-300 rounded px-2 py-1"
                  placeholder="Industry (optional)"
                  value={draft.industry}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [item.id]: { ...draft, industry: e.target.value } })
                  }
                />
                <input
                  className="border border-slate-300 rounded px-2 py-1"
                  placeholder="City (optional)"
                  value={draft.city}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [item.id]: { ...draft, city: e.target.value } })
                  }
                />
                <input
                  className="border border-slate-300 rounded px-2 py-1"
                  placeholder="Country (optional)"
                  value={draft.country}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [item.id]: { ...draft, country: e.target.value } })
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => createProspect(item.id)}
                  className="bg-brand-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                >
                  Create prospect
                </button>
                <input
                  className="border border-slate-300 rounded px-2 py-1 text-sm font-mono flex-1 min-w-[12rem]"
                  placeholder="Match to business UUID"
                  value={draft.businessId}
                  onChange={(e) =>
                    setDrafts({ ...drafts, [item.id]: { ...draft, businessId: e.target.value } })
                  }
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => matchBusiness(item.id)}
                  className="border border-slate-300 px-3 py-2 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Match
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => dismiss(item.id)}
                  className="text-slate-600 border border-slate-200 px-3 py-2 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </article>
          );
        })}

        {items.length === 0 && (
          <p className="text-slate-500 text-center py-12">
            No orphan demand signals. Paste or poll feeds on{' '}
            <Link href="/intent" className="text-brand-700 hover:underline">
              Intent ingest
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
