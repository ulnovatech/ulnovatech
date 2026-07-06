'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MarkRepliedForm } from '@/components/MarkRepliedForm';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type LeadRow = {
  lead: { id: string; status: string; nextFollowUpAt: string | null };
  business: { name: string };
};

export default function FollowUpsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api<{ leads: LeadRow[] }>('/api/crm/follow-ups')
      .then((d) => setLeads(d.leads))
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-4xl">
      <PageHeader title={PAGE_COPY.followUps.title} description={PAGE_COPY.followUps.description} />

      {loading && <p className="text-slate-500">Loading…</p>}

      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.lead.id} className="bg-white border rounded-lg p-4 flex justify-between gap-4">
            <div>
              <h3 className="font-medium">{l.business.name}</h3>
              <p className="text-sm text-slate-500">
                {l.lead.status}
                {l.lead.nextFollowUpAt && (
                  <span className="text-amber-700 font-medium">
                    {' '}
                    · Due {new Date(l.lead.nextFollowUpAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <MarkRepliedForm leadId={l.lead.id} onDone={load} compact />
              <Link href={`/leads/${l.lead.id}`} className="text-brand-600 text-sm">
                Open pursuit →
              </Link>
            </div>
          </div>
        ))}
        {!loading && leads.length === 0 && (
          <p className="text-slate-500 text-center py-12">No overdue follow-ups.</p>
        )}
      </div>
    </div>
  );
}
