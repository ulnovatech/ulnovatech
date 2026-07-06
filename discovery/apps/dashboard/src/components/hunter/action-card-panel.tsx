'use client';

import { useState } from 'react';
import { gapTypeLabel, HUNTER_COPY } from '@/lib/hunter-copy';
import type { HunterActionCardRow } from '@/lib/hunter-types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function confidenceClass(confidence: string) {
  switch (confidence) {
    case 'HIGH':
      return 'text-emerald-300 bg-emerald-500/15 ring-emerald-500/30';
    case 'MEDIUM':
      return 'text-amber-200 bg-amber-500/15 ring-amber-500/30';
    default:
      return 'text-slate-300 bg-slate-500/15 ring-slate-500/30';
  }
}

function riskClass(risk: string) {
  switch (risk) {
    case 'LOW':
      return 'text-emerald-400';
    case 'HIGH':
      return 'text-red-400';
    default:
      return 'text-amber-400';
  }
}

export function ActionCardPanel({
  row,
  onUpdated,
}: {
  row: HunterActionCardRow;
  onUpdated?: (row: HunterActionCardRow) => void;
}) {
  const { card } = row;
  const [busy, setBusy] = useState<'approve' | 'dismiss' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decided = row.status !== 'pending';

  async function act(action: 'approve' | 'dismiss') {
    setBusy(action);
    setError(null);
    try {
      const path =
        action === 'approve'
          ? `/api/market-hunter/cards/${row.id}/approve`
          : `/api/market-hunter/cards/${row.id}/dismiss`;
      const res = await api<{ card: HunterActionCardRow }>(path, { method: 'POST' });
      onUpdated?.(res.card);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <article
      className={cn(
        'rounded-xl border overflow-hidden transition-shadow',
        row.status === 'approved'
          ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-900/20'
          : row.status === 'dismissed'
            ? 'border-slate-700/50 bg-slate-900/30 opacity-60'
            : 'border-amber-800/40 bg-slate-900/70 shadow-xl shadow-black/20 hover:border-amber-600/50',
      )}
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-slate-700/50 bg-slate-950/40">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-amber-500/80">#{card.rank}</span>
            <span
              className={cn(
                'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ring-1',
                confidenceClass(card.confidence),
              )}
            >
              {card.confidence} confidence
            </span>
            {row.status === 'approved' && (
              <span className="text-[10px] uppercase font-semibold text-emerald-400">
                {HUNTER_COPY.approved.title}
              </span>
            )}
            {row.status === 'dismissed' && (
              <span className="text-[10px] uppercase font-semibold text-slate-500">Dismissed</span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 truncate">
            {card.originalProduct}
          </h3>
        </div>

        {!decided && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              disabled={busy != null}
              onClick={() => act('approve')}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              {busy === 'approve' ? '…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={busy != null}
              onClick={() => act('dismiss')}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-2 text-sm font-medium text-slate-200 transition-colors"
              aria-label="Dismiss"
            >
              {busy === 'dismiss' ? '…' : '✕'}
            </button>
          </div>
        )}
      </header>

      <div className="p-4 sm:p-5 grid gap-5 sm:grid-cols-2">
        <section className="space-y-2 text-sm">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Source
          </h4>
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Platform</dt>
              <dd className="text-slate-100 font-medium capitalize">{card.platform}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Sales proof</dt>
              <dd className="text-slate-100 tabular-nums">{card.originalSales.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Price</dt>
              <dd className="text-slate-100 tabular-nums">${card.originalPrice}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-400">Gap</dt>
              <dd className="text-amber-200 text-right text-xs">{gapTypeLabel(card.gapType)}</dd>
            </div>
            <div>
              <dt className="text-slate-400 mb-0.5">Original</dt>
              <dd>
                <a
                  href={card.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline break-all text-xs"
                >
                  {card.originalUrl}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-2 text-sm">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Build spec
          </h4>
          <p className="text-slate-300 text-xs leading-relaxed">{card.buildSpec.coreScope}</p>
          {card.buildSpec.differentiators.length > 0 && (
            <ul className="space-y-1">
              {card.buildSpec.differentiators.map((fix) => (
                <li key={fix} className="text-xs text-slate-200 flex gap-2">
                  <span className="text-amber-500 shrink-0">→</span>
                  {fix}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-400">
            Est. {card.buildSpec.estimatedBuildDays} day
            {card.buildSpec.estimatedBuildDays === 1 ? '' : 's'} · List at $
            {card.buildSpec.recommendedPrice}
          </p>
        </section>

        <section className="space-y-2 text-sm sm:col-span-2 border-t border-slate-800 pt-4">
          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Visibility
          </h4>
          <p className="text-xs text-slate-300">{card.visibilityPlan.exploitableWindow}</p>
          <p className="text-xs">
            <span className="text-slate-500">Risk </span>
            <span className={cn('font-semibold', riskClass(card.visibilityPlan.risk))}>
              {card.visibilityPlan.risk}
            </span>
          </p>
          <p className="text-xs text-slate-400">{card.visibilityPlan.recommendation}</p>
          {card.visibilityPlan.keywordSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {card.visibilityPlan.keywordSuggestions.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="text-xs text-slate-500 sm:col-span-2 border-t border-slate-800 pt-3">
          Payment path: {card.paymentPath}
        </section>
      </div>

      {error && <p className="px-5 pb-4 text-sm text-red-400">{error}</p>}
    </article>
  );
}
