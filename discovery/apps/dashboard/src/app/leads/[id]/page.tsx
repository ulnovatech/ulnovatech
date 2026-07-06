'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PAGE_COPY } from '@/lib/product-copy';
import { MarkRepliedForm } from '@/components/MarkRepliedForm';
import { ReplySuggestionsPanel } from '@/components/ReplySuggestionsPanel';
import { OutreachCompose } from '@/components/OutreachCompose';
import {
  OpportunityBriefPanel,
  type WebsiteOpportunityBrief,
} from '@/components/opportunities/opportunity-brief-panel';
import { api } from '@/lib/api';

type Tab = 'overview' | 'outreach' | 'proposals' | 'signals' | 'analysis';

type LeadHub = {
  lead: {
    id: string;
    accountId: string;
    status: string;
    priority: string;
    nextFollowUpAt: string | null;
  };
  business: {
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
  };
  analysis: {
    hasWebsite: boolean;
    httpsEnabled: boolean | null;
    mobileFriendly: boolean | null;
    notes: string | null;
  } | null;
  opportunityBrief: WebsiteOpportunityBrief | null;
  notes: { id: string; content: string; createdAt: string }[];
  activities: { id: string; type: string; description: string; createdAt: string }[];
  signals: {
    id: string;
    signalType: string;
    signalClass?: string;
    signalStrength: number;
    title: string | null;
    snippet: string | null;
  }[];
  outreach: {
    id: string;
    subject: string | null;
    body: string;
    channel: string;
    sentAt: string | null;
  }[];
  proposals: {
    id: string;
    title: string;
    amount: string | number;
    status: string;
  }[];
  allowedTransitions: string[];
  suppression: { suppressed: boolean; source: 'account' | 'list' | null } | null;
  gmailConnected?: boolean;
  replySuggestions?: Array<{
    id: string;
    subject: string | null;
    snippet: string | null;
    fromEmail: string | null;
    receivedAt: string | null;
  }>;
};

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'proposals', label: 'Proposals' },
  { id: 'signals', label: 'Signals' },
  { id: 'analysis', label: 'Analysis' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<LeadHub | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [note, setNote] = useState('');
  const [proposalAmount, setProposalAmount] = useState('5000');
  const [autoQualify, setAutoQualify] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [lossReason, setLossReason] = useState('');

  const load = () =>
    api<LeadHub>(`/api/crm/leads/${id}`).then(setData).catch(console.error);

  useEffect(() => {
    load();
  }, [id]);

  const transition = async (toStatus: string, transitionNote?: string) => {
    await api(`/api/crm/leads/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ toStatus, note: transitionNote }),
    });
    await load();
  };

  const closeLost = async () => {
    const reason = lossReason.trim() || window.prompt('Loss reason?')?.trim();
    if (!reason) return;
    await api(`/api/crm/leads/${id}/close-lost`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    setLossReason('');
    await load();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    await api(`/api/crm/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: note }),
    });
    setNote('');
    await load();
  };

  const createProposal = async () => {
    setProposalError('');
    try {
      await api('/api/proposals', {
        method: 'POST',
        body: JSON.stringify({
          leadId: id,
          title: `Web development proposal — ${data?.business.name}`,
          amount: Number(proposalAmount),
          autoQualify,
        }),
      });
      await load();
      setTab('proposals');
    } catch (e) {
      setProposalError(String(e));
    }
  };

  const sendProposal = async (proposalId: string) => {
    setProposalError('');
    try {
      await api(`/api/proposals/${proposalId}/send`, { method: 'POST' });
      await load();
    } catch (e) {
      setProposalError(String(e));
    }
  };

  if (!data) return <p className="text-slate-500">Loading…</p>;

  const canMarkReplied =
    data.lead.status === 'CONTACTED' || data.lead.status === 'NO_RESPONSE';
  const canCloseLost = data.allowedTransitions.includes('CLOSED_LOST');
  const canCreateProposal =
    data.lead.status === 'QUALIFIED' ||
    (data.lead.status === 'REPLIED' && autoQualify);

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link href="/leads" className="text-sm text-brand-700 hover:underline">
          ← {PAGE_COPY.pursuits.title}
        </Link>
        <h2 className="text-2xl font-semibold mt-2">{data.business.name}</h2>
        <p className="text-xs text-slate-500 mt-0.5">Pursuit</p>
        {data.suppression?.suppressed && (
          <p className="mt-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-800">
              {data.suppression.source === 'account'
                ? 'Account suppressed'
                : 'On suppression list'}
            </span>
          </p>
        )}
        <p className="text-slate-600 text-sm mt-1">
          Status: <strong>{data.lead.status}</strong> · Priority: {data.lead.priority}
          {data.lead.nextFollowUpAt && (
            <span>
              {' '}
              · Follow up {new Date(data.lead.nextFollowUpAt).toLocaleDateString()}
            </span>
          )}
        </p>
        {data.lead.accountId && (
          <p className="text-sm mt-2">
            <Link
              href={`/data-quality?accountId=${encodeURIComponent(data.lead.accountId)}`}
              className="text-brand-700 hover:underline"
            >
              Check duplicate accounts
            </Link>
          </p>
        )}
        {(data.business.email || data.business.phone) && (
          <p className="text-sm text-slate-500 mt-1">
            {data.business.email}
            {data.business.email && data.business.phone && ' · '}
            {data.business.phone}
          </p>
        )}
      </div>

      {data.opportunityBrief && (
        <div className="mb-6">
          <OpportunityBriefPanel brief={data.opportunityBrief} />
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
            {t.id === 'outreach' && data.outreach.length > 0 && (
              <span className="ml-1 text-xs">({data.outreach.length})</span>
            )}
            {t.id === 'proposals' && data.proposals.length > 0 && (
              <span className="ml-1 text-xs">({data.proposals.length})</span>
            )}
            {t.id === 'signals' && data.signals.length > 0 && (
              <span className="ml-1 text-xs">({data.signals.length})</span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {tab === 'overview' && (
            <>
              {data.gmailConnected && data.replySuggestions && (
                <ReplySuggestionsPanel
                  leadId={id}
                  suggestions={data.replySuggestions}
                  onDone={load}
                />
              )}
              {canMarkReplied && (
                <MarkRepliedForm leadId={id} onDone={load} />
              )}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">Notes</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    className="flex-1 border rounded-md px-3 py-2 text-sm"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note…"
                  />
                  <button
                    onClick={addNote}
                    className="bg-slate-800 text-white px-4 rounded-md text-sm"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-2 text-sm">
                  {data.notes.map((n) => (
                    <li key={n.id} className="text-slate-600 border-l-2 pl-3 border-slate-200">
                      {n.content}
                    </li>
                  ))}
                  {data.notes.length === 0 && (
                    <li className="text-slate-400 italic">No notes yet.</li>
                  )}
                </ul>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2">Activity</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  {data.activities.map((a) => (
                    <li key={a.id}>
                      {a.description}{' '}
                      <span className="text-xs text-slate-400">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {tab === 'outreach' && (
            <div className="space-y-4">
              {canMarkReplied && (
                <MarkRepliedForm leadId={id} onDone={load} />
              )}
              <OutreachCompose
                leadId={id}
                leadLabel={data.business.name}
                onRecorded={load}
              />
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h3 className="font-medium">Outreach history</h3>
                {data.outreach.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No outreach recorded yet.</p>
                )}
                {data.outreach.map((m) => (
                  <div key={m.id} className="border border-slate-100 rounded p-3 text-sm">
                    <p className="font-medium text-slate-800">
                      {m.subject || '(no subject)'} · {m.channel}
                    </p>
                    <p className="text-slate-600 mt-1 whitespace-pre-wrap">{m.body}</p>
                    {m.sentAt && (
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(m.sentAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'proposals' && (
            <div className="bg-white border rounded-lg p-4 space-y-3">
              <h3 className="font-medium">Proposals</h3>
              {proposalError && <p className="text-sm text-red-600">{proposalError}</p>}
              {data.proposals.length === 0 && (
                <p className="text-sm text-slate-500 italic">No proposals yet.</p>
              )}
              {data.proposals.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-start gap-3 border border-slate-100 rounded p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-slate-500">{p.status}</p>
                    {p.status === 'draft' && data.lead.status === 'QUALIFIED' && (
                      <button
                        type="button"
                        onClick={() => sendProposal(p.id)}
                        className="mt-2 text-brand-600 hover:underline text-xs"
                      >
                        Send proposal → PROPOSAL_SENT
                      </button>
                    )}
                    {p.status === 'draft' && data.lead.status !== 'QUALIFIED' && (
                      <p className="mt-1 text-xs text-amber-700">Qualify lead before sending</p>
                    )}
                  </div>
                  <p className="font-semibold text-brand-700 shrink-0">
                    ${Number(p.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'signals' && (
            <div className="bg-white border rounded-lg p-4 space-y-2">
              <h3 className="font-medium mb-2">Intent signals</h3>
              {data.signals.length === 0 && (
                <p className="text-sm text-slate-500 italic">No signals linked to this business.</p>
              )}
              {data.signals.map((s) => (
                <div
                  key={s.id}
                  className={`text-sm px-3 py-2 rounded border ${
                    s.signalClass === 'demand'
                      ? 'bg-amber-50 border-amber-100 text-amber-900'
                      : 'bg-purple-50 border-purple-100 text-purple-900'
                  }`}
                >
                  <strong>{s.title ?? s.signalType}</strong> ({s.signalStrength})
                  <span className="ml-1 opacity-70">
                    · {s.signalClass === 'demand' ? 'demand' : 'enrichment'}
                  </span>
                  {s.snippet && <p className="mt-1 font-normal opacity-90">{s.snippet}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === 'analysis' && (
            <div className="space-y-4">
              {data.opportunityBrief ? (
                <OpportunityBriefPanel brief={data.opportunityBrief} />
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No opportunity brief — run discovery or link demand signals first.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">Status</h3>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm mb-2"
              value=""
              onChange={(e) => {
                if (e.target.value) transition(e.target.value);
                e.target.value = '';
              }}
            >
              <option value="">Change status…</option>
              {data.allowedTransitions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {data.allowedTransitions.length === 0 && (
              <p className="text-xs text-slate-500">No further transitions available.</p>
            )}
          </div>

          {canCloseLost && (
            <div className="bg-white border border-red-100 rounded-lg p-4">
              <h3 className="font-medium mb-2 text-red-800">Close lost</h3>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                placeholder="Loss reason"
                value={lossReason}
                onChange={(e) => setLossReason(e.target.value)}
              />
              <button
                onClick={closeLost}
                className="w-full border border-red-300 text-red-700 py-2 rounded-md text-sm hover:bg-red-50"
              >
                Mark CLOSED_LOST
              </button>
            </div>
          )}

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-2">Create proposal</h3>
            <p className="text-xs text-slate-500 mb-2">
              Requires QUALIFIED, or REPLIED with auto-qualify.
            </p>
            {data.lead.status === 'REPLIED' && (
              <label className="flex items-center gap-2 text-sm mb-2">
                <input
                  type="checkbox"
                  checked={autoQualify}
                  onChange={(e) => setAutoQualify(e.target.checked)}
                />
                Auto-qualify (REPLIED → QUALIFIED)
              </label>
            )}
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2 text-sm mb-2"
              value={proposalAmount}
              onChange={(e) => setProposalAmount(e.target.value)}
            />
            {proposalError && (
              <p className="text-xs text-red-600 mb-2">{proposalError}</p>
            )}
            <button
              onClick={createProposal}
              disabled={!canCreateProposal}
              className="w-full bg-brand-600 text-white py-2 rounded-md text-sm hover:bg-brand-700 disabled:opacity-50"
            >
              Create proposal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
