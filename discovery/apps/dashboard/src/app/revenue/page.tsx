'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type Summary = {
  mtd: number;
  total: number;
  dealCount: number;
  retainerCount: number;
  records: { id: string; amount: number; type: string; closedAt: string; proposalId: string | null }[];
};

type CloseableDeal = {
  lead: { id: string; status: string };
  business: { name: string };
  proposal: { id: string; amount: number; title: string } | null;
};

export default function RevenuePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [deals, setDeals] = useState<CloseableDeal[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    leadId: '',
    proposalId: '',
    clientName: '',
    amount: '5000',
    type: 'one_time' as 'one_time' | 'retainer',
  });

  const load = () => {
    api<Summary>('/api/revenue').then(setSummary);
    api<{ deals: CloseableDeal[] }>('/api/revenue/closeable').then((d) => setDeals(d.deals));
  };

  useEffect(() => {
    load();
  }, []);

  const closeDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api('/api/revenue', {
        method: 'POST',
        body: JSON.stringify({
          leadId: form.leadId,
          proposalId: form.proposalId || undefined,
          clientName: form.clientName,
          amount: Number(form.amount),
          type: form.type,
        }),
      });
      await load();
      setForm({ leadId: '', proposalId: '', clientName: '', amount: '5000', type: 'one_time' });
    } catch (err) {
      setError(String(err));
    }
  };

  const selectDeal = (deal: CloseableDeal) => {
    setForm({
      ...form,
      leadId: deal.lead.id,
      proposalId: deal.proposal?.id ?? '',
      clientName: deal.business.name,
      amount: String(deal.proposal?.amount ?? form.amount),
    });
  };

  if (!summary) return <p>Loading…</p>;

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader title={PAGE_COPY.revenue.title} description={PAGE_COPY.revenue.description} />
      <p className="text-slate-600 text-sm mb-6 -mt-2">
        Close deals only from PROPOSAL_SENT pursuits. Proposal is marked accepted on close.
      </p>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-500">MTD</p>
          <p className="text-2xl font-bold">${summary.mtd.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-500">All time</p>
          <p className="text-2xl font-bold">${summary.total.toLocaleString()}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-500">Deals</p>
          <p className="text-2xl font-bold">{summary.dealCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-500">Retainers</p>
          <p className="text-2xl font-bold">{summary.retainerCount}</p>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={closeDeal} className="bg-white border rounded-lg p-4 grid grid-cols-2 gap-4">
        <h3 className="col-span-2 font-medium">Close deal (PROPOSAL_SENT only)</h3>
        <select
          className="border rounded-md px-3 py-2 text-sm col-span-2"
          value={form.leadId}
          onChange={(e) => {
            const deal = deals.find((d) => d.lead.id === e.target.value);
            if (deal) selectDeal(deal);
            else setForm({ ...form, leadId: e.target.value });
          }}
          required
        >
          <option value="">Select lead with sent proposal…</option>
          {deals.map((d) => (
            <option key={d.lead.id} value={d.lead.id}>
              {d.business.name}
              {d.proposal ? ` — $${Number(d.proposal.amount).toLocaleString()}` : ''}
            </option>
          ))}
        </select>
        {deals.length === 0 && (
          <p className="col-span-2 text-sm text-slate-500 italic">
            No PROPOSAL_SENT leads. Send a proposal from the Proposals page first.
          </p>
        )}
        <input
          className="border rounded-md px-3 py-2 text-sm"
          placeholder="Client name"
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
          required
        />
        <input
          type="number"
          className="border rounded-md px-3 py-2 text-sm"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <select
          className="border rounded-md px-3 py-2 text-sm"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as 'one_time' | 'retainer' })}
        >
          <option value="one_time">One-time</option>
          <option value="retainer">Retainer</option>
        </select>
        {form.proposalId && (
          <p className="col-span-2 text-xs text-slate-500">
            Linked proposal: {form.proposalId.slice(0, 8)}…
          </p>
        )}
        <button
          type="submit"
          className="col-span-2 bg-green-600 text-white py-2 rounded-md font-medium"
          disabled={deals.length === 0}
        >
          Record closed deal → CLOSED_WON
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Amount</th>
              <th className="p-3">Type</th>
              <th className="p-3">Proposal</th>
              <th className="p-3">Closed</th>
            </tr>
          </thead>
          <tbody>
            {summary.records.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">${r.amount.toLocaleString()}</td>
                <td className="p-3">{r.type}</td>
                <td className="p-3 text-slate-500">
                  {r.proposalId ? (
                    <Link href="/proposals" className="text-brand-600 hover:underline">
                      linked
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-3">{new Date(r.closedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
