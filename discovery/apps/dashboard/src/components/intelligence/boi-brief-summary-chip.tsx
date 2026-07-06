'use client';

import { useEffect, useState } from 'react';
import type { BoIOpportunityBriefPayload } from '@agency/intelligence';
import { api } from '@/lib/api';
import { BOI_COPY } from '@/lib/product-copy';

type BoiBriefSummaryChipProps = {
  businessId: string;
  onOpen?: () => void;
};

/**
 * Compact BOI summary for scan rows — lazy-loads once per business.
 */
export function BoiBriefSummaryChip({ businessId, onOpen }: BoiBriefSummaryChipProps) {
  const [brief, setBrief] = useState<BoIOpportunityBriefPayload | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'empty' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    api<{ brief: BoIOpportunityBriefPayload }>(`/api/intelligence/opportunity-brief/${businessId}`)
      .then((res) => {
        if (cancelled) return;
        setBrief(res.brief);
        setState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setState('empty');
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (state === 'loading' || state === 'idle') {
    return (
      <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
        {BOI_COPY.shortName}…
      </span>
    );
  }

  if (state === 'empty' || state === 'error' || !brief) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex text-[10px] px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-violet-300 hover:text-violet-700"
      >
        {BOI_COPY.shortName} pending
      </button>
    );
  }

  const topPain = brief.pains[0]?.label;
  const readiness = brief.purchaseReadiness?.score;
  const label = topPain
    ? topPain.length > 36
      ? `${topPain.slice(0, 36)}…`
      : topPain
    : brief.salesBrief?.recommendedServices?.[0] ?? BOI_COPY.status[brief.status];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex flex-col items-start text-left max-w-[220px] text-[10px] px-2 py-1 rounded-lg border border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100 transition-colors"
      title={BOI_COPY.viewBrief}
    >
      <span className="font-semibold uppercase tracking-wide text-violet-700">{BOI_COPY.shortName}</span>
      <span className="font-medium leading-tight mt-0.5">{label}</span>
      {readiness != null && (
        <span className="text-violet-700/80 mt-0.5 tabular-nums">
          {readiness}/100 {BOI_COPY.purchaseReadiness.toLowerCase()}
        </span>
      )}
    </button>
  );
}
