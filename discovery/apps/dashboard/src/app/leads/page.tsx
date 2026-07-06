'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type LeadRow = {
  lead: { id: string; status: string; priority: string };
  business: { name: string; city: string | null };
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    api<{ leads: LeadRow[] }>('/api/crm/leads').then((d) => setLeads(d.leads)).catch(console.error);
  }, []);

  return (
    <div className="max-w-5xl">
      <PageHeader title={PAGE_COPY.pursuits.title} description={PAGE_COPY.pursuits.description} />
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Status</th>
              <th className="p-3">Priority</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((r) => (
              <tr key={r.lead.id} className="border-t">
                <td className="p-3 font-medium">{r.business.name}</td>
                <td className="p-3">{r.lead.status}</td>
                <td className="p-3">{r.lead.priority}</td>
                <td className="p-3 text-right">
                  <Link href={`/leads/${r.lead.id}`} className="text-brand-600 hover:underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
