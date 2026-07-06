'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

type DuplicateAccount = {
  accountId: string;
  canonicalName: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  source: string;
  businessCount: number;
  activeLeadStatus: string | null;
  matchKind: string;
  score: number;
};

type DuplicateGroup = {
  matchKind: string;
  matchKey: string;
  score: number;
  accounts: DuplicateAccount[];
};

function AccountCard({ account }: { account: DuplicateAccount }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 min-w-0 flex-1">
      <h3 className="font-semibold text-slate-900 truncate">{account.canonicalName}</h3>
      <dl className="text-sm text-slate-600 space-y-1">
        <div>
          <span className="text-slate-500">City:</span> {account.city ?? '—'}
        </div>
        <div>
          <span className="text-slate-500">Phone:</span> {account.phone ?? '—'}
        </div>
        <div>
          <span className="text-slate-500">Email:</span> {account.email ?? '—'}
        </div>
        <div className="truncate">
          <span className="text-slate-500">Web:</span> {account.website ?? '—'}
        </div>
        <div>
          <span className="text-slate-500">Source:</span> {account.source}
        </div>
        <div>
          <span className="text-slate-500">Businesses:</span> {account.businessCount}
        </div>
        <div>
          <span className="text-slate-500">Active lead:</span>{' '}
          {account.activeLeadStatus ?? 'none'}
        </div>
      </dl>
    </div>
  );
}

export function DataQualityClient() {
  const searchParams = useSearchParams();
  const focusAccountId = searchParams.get('accountId');

  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [focusedCandidates, setFocusedCandidates] = useState<DuplicateAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scanRes, focusRes] = await Promise.all([
        api<{ groups: DuplicateGroup[] }>('/api/accounts/duplicates?scan=true&limit=50'),
        focusAccountId
          ? api<{ candidates: DuplicateAccount[] }>(
              `/api/accounts/duplicates?accountId=${encodeURIComponent(focusAccountId)}`,
            )
          : Promise.resolve({ candidates: [] }),
      ]);
      setGroups(scanRes.groups);
      setFocusedCandidates(focusRes.candidates);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load duplicates');
    } finally {
      setLoading(false);
    }
  }, [focusAccountId]);

  useEffect(() => {
    load();
  }, [load]);

  const merge = async (survivorId: string, mergedId: string, matchKinds?: string[]) => {
    const key = `${survivorId}:${mergedId}`;
    setMerging(key);
    setError(null);
    try {
      await api('/api/accounts/merge', {
        method: 'POST',
        body: JSON.stringify({ survivorId, mergedId, matchKinds }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Merge failed');
    } finally {
      setMerging(null);
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Data quality</h1>
        <p className="text-sm text-slate-600 mt-1">
          Find and merge duplicate accounts. Hard matches use shared phone or business domain.
          Both accounts cannot have an active lead — close or resolve leads first.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-800 text-sm p-3">
          {error}
        </div>
      )}

      {focusAccountId && focusedCandidates.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Candidates for account</h2>
          <p className="text-xs text-slate-500 font-mono">{focusAccountId}</p>
          <div className="space-y-4">
            {focusedCandidates.map((candidate) => (
              <div
                key={candidate.accountId}
                className="flex flex-col lg:flex-row gap-4 items-stretch border border-brand-100 rounded-lg p-4 bg-brand-50/30"
              >
                <AccountCard account={candidate} />
                <div className="flex lg:flex-col gap-2 justify-center shrink-0">
                  <button
                    type="button"
                    disabled={merging !== null}
                    onClick={() =>
                      merge(focusAccountId, candidate.accountId, [candidate.matchKind])
                    }
                    className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {merging === `${focusAccountId}:${candidate.accountId}`
                      ? 'Merging…'
                      : 'Keep focused → merge other'}
                  </button>
                  <button
                    type="button"
                    disabled={merging !== null}
                    onClick={() =>
                      merge(candidate.accountId, focusAccountId, [candidate.matchKind])
                    }
                    className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    Keep other → merge focused
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Duplicate groups</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-slate-500">No duplicate groups detected.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <article
                key={`${group.matchKind}:${group.matchKey}`}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-900 capitalize">{group.matchKind}</span>
                  <span className="text-slate-500 font-mono">{group.matchKey}</span>
                  <span className="text-slate-400">· {group.accounts.length} accounts</span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {group.accounts.map((account) => (
                    <AccountCard key={account.accountId} account={account} />
                  ))}
                </div>
                {group.accounts.length === 2 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={merging !== null}
                      onClick={() =>
                        merge(group.accounts[0].accountId, group.accounts[1].accountId, [
                          group.matchKind,
                        ])
                      }
                      className="px-3 py-2 text-sm rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Merge into {group.accounts[0].canonicalName}
                    </button>
                    <button
                      type="button"
                      disabled={merging !== null}
                      onClick={() =>
                        merge(group.accounts[1].accountId, group.accounts[0].accountId, [
                          group.matchKind,
                        ])
                      }
                      className="px-3 py-2 text-sm rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                    >
                      Merge into {group.accounts[1].canonicalName}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Tip: from a{' '}
        <Link href="/leads" className="text-brand-700 hover:underline">
          lead
        </Link>
        , use &quot;Check duplicate accounts&quot; to focus an account here.
      </p>
    </div>
  );
}
