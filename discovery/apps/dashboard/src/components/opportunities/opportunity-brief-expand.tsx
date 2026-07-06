'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  OpportunityBriefPanel,
  type WebsiteOpportunityBrief,
} from '@/components/opportunities/opportunity-brief-panel';

export function OpportunityBriefExpand({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState<WebsiteOpportunityBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (brief) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api<{ brief: WebsiteOpportunityBrief }>(
        `/api/qualification/opportunity-brief/${businessId}`,
      );
      setBrief(res.brief);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load brief');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-2 border-t border-slate-100">
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-brand-700 hover:underline font-medium"
      >
        {open ? 'Hide website brief' : 'View website brief'}
        {loading && '…'}
      </button>
      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
      {open && brief && (
        <div className="mt-3">
          <OpportunityBriefPanel brief={brief} />
        </div>
      )}
    </div>
  );
}
