'use client';

import { HUNTER_COPY, scanStatusLabel } from '@/lib/hunter-copy';
import type { HunterScan, HunterScanStats } from '@/lib/hunter-types';
import { cn } from '@/lib/utils';

function statusTone(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30';
    case 'running':
      return 'bg-amber-500/20 text-amber-200 ring-amber-500/40 animate-pulse';
    case 'failed':
      return 'bg-red-500/20 text-red-300 ring-red-500/40';
    case 'pending':
      return 'bg-slate-500/20 text-slate-300 ring-slate-500/30';
    default:
      return 'bg-slate-500/20 text-slate-300 ring-slate-500/30';
  }
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-semibold text-slate-100 tabular-nums">{value}</p>
    </div>
  );
}

function platformLines(stats: HunterScanStats | null | undefined) {
  if (!stats?.byPlatform) return [];
  return Object.entries(stats.byPlatform).map(([platform, row]) => ({
    platform,
    text: `${row.listings} listings · ${row.ghosts} ghosts · ${row.cards} cards`,
  }));
}

export function ScanProgress({
  scan,
  loading,
}: {
  scan: HunterScan | null;
  loading?: boolean;
}) {
  if (loading && !scan) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-700 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!scan) return null;

  const stats = (scan.stats ?? {}) as HunterScanStats;
  const isActive = scan.status === 'pending' || scan.status === 'running';
  const isFailed = scan.status === 'failed';
  const lines = platformLines(stats);

  return (
    <div className="rounded-xl border border-amber-900/30 bg-slate-900/60 backdrop-blur p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-xs text-slate-400 font-mono truncate max-w-[240px] sm:max-w-none">
            {scan.id}
          </p>
          <span
            className={cn(
              'inline-flex mt-2 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
              statusTone(scan.status),
            )}
          >
            {scanStatusLabel(scan.status)}
          </span>
        </div>
        {isActive && (
          <p className="text-sm text-amber-200/80 max-w-sm">{HUNTER_COPY.running.description}</p>
        )}
        {isFailed && scan.errorMessage && (
          <p className="text-sm text-red-300 max-w-lg">{scan.errorMessage}</p>
        )}
      </div>

      {(scan.status === 'completed' || scan.status === 'running' || stats.listingsFetched != null) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill label="Listings" value={stats.listingsFetched ?? '—'} />
          <StatPill label="Ghosts filtered" value={stats.ghostsFiltered ?? '—'} />
          <StatPill label="Cards" value={stats.cardsGenerated ?? '—'} />
          <StatPill
            label="Spend"
            value={stats.spendUsd != null ? `$${stats.spendUsd.toFixed(4)}` : '—'}
          />
        </div>
      )}

      {lines.length > 0 && (
        <div className="rounded-lg bg-black/30 border border-slate-800 p-3 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
          <p className="text-slate-500 mb-2">// platform breakdown</p>
          {lines.map((line) => (
            <p key={line.platform} className="text-emerald-400/90">
              <span className="text-amber-400">{line.platform}</span> → {line.text}
            </p>
          ))}
        </div>
      )}

      {(stats.type1Flags?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs">
          <p className="text-amber-400 font-medium mb-1">
            Type-1 demand signals ({stats.type1Flags!.length})
          </p>
          <p className="text-slate-400">
            Reddit/G2 threads stored for context — not auto-promoted to build cards.
          </p>
        </div>
      )}

      {isActive && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          Polling for updates…
        </div>
      )}
    </div>
  );
}
