'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BoIOpportunityBriefPayload } from '@agency/intelligence';
import { api } from '@/lib/api';
import { BOI_COPY } from '@/lib/product-copy';
import {
  OpportunityBriefPanel,
  OpportunityBriefPanelEmpty,
  OpportunityBriefPanelError,
  OpportunityBriefPanelSkeleton,
} from './opportunity-brief-panel';

type BoiBriefExpandProps = {
  businessId: string;
  pipelineRunning?: boolean;
  defaultOpen?: boolean;
  compact?: boolean;
  onClose?: () => void;
  embedded?: boolean;
};

export function BoiBriefExpand({
  businessId,
  pipelineRunning = false,
  defaultOpen = false,
  compact = false,
  onClose,
  embedded = false,
}: BoiBriefExpandProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [brief, setBrief] = useState<BoIOpportunityBriefPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await api<{ brief: BoIOpportunityBriefPayload }>(
        `/api/intelligence/opportunity-brief/${businessId}`,
      );
      setBrief(res.brief);
    } catch (e) {
      const message = e instanceof Error ? e.message : BOI_COPY.errorLoad;
      if (message.toLowerCase().includes('not available') || message.toLowerCase().includes('not found')) {
        setNotFound(true);
        setBrief(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (defaultOpen && !brief && !loading && !notFound && !error) {
      load().catch(() => undefined);
      setOpen(true);
    }
  }, [defaultOpen, brief, loading, notFound, error, load]);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      onClose?.();
      return;
    }
    setOpen(true);
    if (!brief && !notFound) {
      await load();
    }
  };

  return (
    <div className={embedded ? '' : 'pt-2 border-t border-slate-100'}>
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-violet-700 hover:text-violet-900 hover:underline font-medium inline-flex items-center gap-1"
      >
        {open ? BOI_COPY.hideBrief : BOI_COPY.viewBrief}
        {loading && <span className="text-slate-400">…</span>}
      </button>

      {open && (
        <div className="mt-3">
          {loading && <OpportunityBriefPanelSkeleton />}
          {!loading && error && (
            <OpportunityBriefPanelError message={error} onRetry={() => load()} />
          )}
          {!loading && !error && notFound && (
            <OpportunityBriefPanelEmpty pipelineRunning={pipelineRunning} />
          )}
          {!loading && !error && brief && (
            <OpportunityBriefPanel brief={brief} compact={compact} />
          )}
        </div>
      )}
    </div>
  );
}
