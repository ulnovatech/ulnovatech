'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type Proposal = {
  id: string;
  leadId: string;
  title: string;
  amount: number;
  status: string;
  businessName: string;
  leadStatus: string;
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [error, setError] = useState('');

  const load = () =>
    api<{ proposals: Proposal[] }>('/api/proposals').then((d) => setProposals(d.proposals));

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const send = async (id: string) => {
    setError('');
    try {
      await api(`/api/proposals/${id}/send`, { method: 'POST' });
      await load();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title={PAGE_COPY.proposals.title} description={PAGE_COPY.proposals.description} />
      <p className="text-slate-600 text-sm mb-6 -mt-2">
        Create from a QUALIFIED pursuit. Send moves status to PROPOSAL_SENT.
      </p>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Title</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Lead</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <Link href={`/leads/${p.leadId}`} className="text-brand-600 hover:underline">
                    {p.businessName}
                  </Link>
                </td>
                <td className="p-3">{p.title}</td>
                <td className="p-3">${Number(p.amount).toLocaleString()}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3 text-slate-500">{p.leadStatus}</td>
                <td className="p-3 text-right">
                  {p.status === 'draft' && p.leadStatus === 'QUALIFIED' && (
                    <button
                      onClick={() => send(p.id)}
                      className="text-brand-600 hover:underline text-sm"
                    >
                      Send proposal
                    </button>
                  )}
                  {p.status === 'draft' && p.leadStatus !== 'QUALIFIED' && (
                    <span className="text-xs text-amber-700">Qualify lead first</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {proposals.length === 0 && (
          <p className="p-6 text-center text-slate-500">No proposals yet. Create from a lead.</p>
        )}
      </div>
    </div>
  );
}
