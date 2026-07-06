'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ActionCardPanel } from '@/components/hunter/action-card-panel';
import { HunterSetupCard } from '@/components/hunter/hunter-setup-card';
import { ScanProgress } from '@/components/hunter/scan-progress';
import { api } from '@/lib/api';
import { HUNTER_COPY, HUNTER_PRODUCT } from '@/lib/hunter-copy';
import type { HunterBudget, HunterHealth, HunterScan } from '@/lib/hunter-types';
import { cn } from '@/lib/utils';

function HunterPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs text-amber-500/70 font-medium mb-1">{HUNTER_PRODUCT.tagline}</p>
      <h2 className="text-2xl font-semibold text-amber-50">{title}</h2>
      {description && <p className="text-sm text-slate-400 mt-1 max-w-2xl">{description}</p>}
    </div>
  );
}

export default function HunterHomePage() {
  const [scans, setScans] = useState<HunterScan[]>([]);
  const [health, setHealth] = useState<HunterHealth | null>(null);
  const [budget, setBudget] = useState<HunterBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [scanRes, healthRes, budgetRes] = await Promise.all([
        api<{ scans: HunterScan[] }>('/api/market-hunter/scans'),
        api<HunterHealth>('/api/market-hunter/health'),
        api<{ budget: HunterBudget }>('/api/market-hunter/budget'),
      ]);
      setScans(scanRes.scans);
      setHealth(healthRes);
      setBudget(budgetRes.budget);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startScan() {
    setStarting(true);
    setError(null);
    try {
      const res = await api<{ scanId: string; message?: string }>('/api/market-hunter/scans', {
        method: 'POST',
      });
      await load();
      window.location.href = `/hunter/scans/${res.scanId}`;
    } catch (e) {
      setError(String(e));
      setStarting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <HunterPageHeader title={HUNTER_COPY.home.title} description={HUNTER_COPY.home.description} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && health && <HunterSetupCard health={health} />}

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-amber-900/30 bg-slate-900/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">System status</p>
          {loading ? (
            <p className="text-sm text-slate-400 animate-pulse">Checking…</p>
          ) : health ? (
            <div className="space-y-2">
              <p
                className={cn(
                  'text-sm font-medium',
                  health.ready ? 'text-emerald-400' : 'text-amber-300',
                )}
              >
                {health.ready ? 'Ready to scan' : (health.message ?? 'Not ready')}
              </p>
              <p className="text-xs text-slate-500">
                Cap ${health.settings.maxSpendPerRunUsd}/run ·{' '}
                {health.platforms.filter((p) => p.enabled).length} platforms enabled
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-amber-900/30 bg-slate-900/50 p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Spend</p>
          {budget ? (
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-100 tabular-nums">
                ${budget.totalSpendUsd.toFixed(4)}
              </p>
              <p className="text-xs text-slate-500">Lifetime API spend (Grok + Claude)</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">—</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          type="button"
          onClick={startScan}
          disabled={starting || loading || !health?.ready}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-hunter-950 transition-colors shadow-lg shadow-amber-900/30"
        >
          {starting ? 'Starting scan…' : 'Start new scan'}
        </button>
        {!health?.ready && health?.enabled && (
          <p className="text-xs text-amber-300/80">Complete setup in Settings to start scanning.</p>
        )}
        {!health?.enabled && (
          <p className="text-xs text-amber-300/80">Enable Market Hunter in Settings first.</p>
        )}
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent scans</h3>

        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-lg bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && scans.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
            <p className="font-medium text-slate-300">{HUNTER_COPY.emptyScans.title}</p>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              {HUNTER_COPY.emptyScans.description}
            </p>
          </div>
        )}

        {!loading && scans.length > 0 && (
          <ul className="space-y-2">
            {scans.map((scan) => {
              const stats = scan.stats;
              const cards = stats?.cardsGenerated;
              return (
                <li key={scan.id}>
                  <Link
                    href={`/hunter/scans/${scan.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-900/40 hover:border-amber-700/40 hover:bg-slate-900/60 px-4 py-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-slate-500 truncate">{scan.id}</p>
                      <p className="text-sm text-slate-200 capitalize">{scan.status}</p>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
                      {cards != null ? `${cards} cards` : '—'} ·{' '}
                      {new Date(scan.createdAt).toLocaleString()}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
