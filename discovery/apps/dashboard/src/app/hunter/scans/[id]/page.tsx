'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ActionCardPanel } from '@/components/hunter/action-card-panel';
import { ScanProgress } from '@/components/hunter/scan-progress';
import { api } from '@/lib/api';
import { HUNTER_COPY, HUNTER_PRODUCT } from '@/lib/hunter-copy';
import type { HunterActionCardRow, HunterScan } from '@/lib/hunter-types';

const POLL_MS = 3000;

export default function HunterScanDetailPage() {
  const params = useParams();
  const scanId = typeof params.id === 'string' ? params.id : '';

  const [scan, setScan] = useState<HunterScan | null>(null);
  const [cards, setCards] = useState<HunterActionCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!scanId) return;
    try {
      const [scanRes, cardsRes] = await Promise.all([
        api<{ scan: HunterScan | null }>(`/api/market-hunter/scans/${scanId}`),
        api<{ cards: HunterActionCardRow[] }>(`/api/market-hunter/scans/${scanId}/cards`),
      ]);
      if (scanRes.scan) setScan(scanRes.scan);
      setCards(cardsRes.cards);
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [scanId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!scan) return;
    const active = scan.status === 'pending' || scan.status === 'running';
    if (!active) return;

    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [scan?.status, load, scan]);

  function handleCardUpdated(updated: HunterActionCardRow) {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  const pendingCards = cards.filter((c) => c.status === 'pending');
  const approvedCards = cards.filter((c) => c.status === 'approved');

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link
          href="/hunter"
          className="text-xs text-amber-500/80 hover:text-amber-400 mb-2 inline-block"
        >
          ← All scans
        </Link>
        <p className="text-xs text-amber-500/70 font-medium mb-1">{HUNTER_PRODUCT.name}</p>
        <h2 className="text-2xl font-semibold text-amber-50">{HUNTER_COPY.scanDetail.title}</h2>
        <p className="text-sm text-slate-400 mt-1">{HUNTER_COPY.scanDetail.description}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-8">
        <ScanProgress scan={scan} loading={loading} />
      </div>

      {scan?.status === 'failed' && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/20 p-5">
          <p className="font-medium text-red-300">{HUNTER_COPY.error.title}</p>
          <p className="text-sm text-red-300/70 mt-1">{HUNTER_COPY.error.description}</p>
        </div>
      )}

      {approvedCards.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3">Approved backlog</h3>
          <div className="space-y-4">
            {approvedCards.map((row) => (
              <ActionCardPanel key={row.id} row={row} onUpdated={handleCardUpdated} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">
          Action cards
          {pendingCards.length > 0 && (
            <span className="text-slate-500 font-normal ml-2">({pendingCards.length} pending)</span>
          )}
        </h3>

        {loading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        )}

        {!loading &&
          scan &&
          (scan.status === 'completed' || scan.status === 'partial') &&
          pendingCards.length === 0 &&
          approvedCards.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center">
              <p className="font-medium text-slate-300">{HUNTER_COPY.emptyCards.title}</p>
              <p className="text-sm text-slate-500 mt-1">{HUNTER_COPY.emptyCards.description}</p>
            </div>
          )}

        {!loading && (scan?.status === 'pending' || scan?.status === 'running') && cards.length === 0 && (
          <div className="rounded-xl border border-amber-900/30 bg-slate-900/30 p-6 text-center">
            <p className="text-sm text-amber-200/80">{HUNTER_COPY.running.description}</p>
          </div>
        )}

        <div className="space-y-4">
          {cards
            .filter((c) => c.status !== 'approved')
            .map((row) => (
              <ActionCardPanel key={row.id} row={row} onUpdated={handleCardUpdated} />
            ))}
        </div>
      </section>
    </div>
  );
}
