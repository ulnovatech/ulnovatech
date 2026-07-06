'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { OutreachCompose } from '@/components/OutreachCompose';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type OpportunityType =
  | 'demand_response'
  | 'greenfield'
  | 'redesign'
  | 'modernize'
  | 'general'
  | '';

type Template = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  channel: string;
  opportunityType?: string | null;
};
type LeadRow = {
  lead: { id: string; status: string; priority: string };
  business: { name: string };
};

const DEFAULT_STATUS_FILTERS = ['REVIEWED', 'CONTACTED'] as const;
const ALL_STATUS_FILTERS = ['NEW', 'REVIEWED', 'CONTACTED'] as const;

export default function OutreachPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [ownerScope, setOwnerScope] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string[]>([...DEFAULT_STATUS_FILTERS]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [exportTemplateId, setExportTemplateId] = useState('');
  const [includeUnreviewedExport, setIncludeUnreviewedExport] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: 'Intro — Web Services',
    subject: 'Quick idea for {{business}}',
    body: 'Hi {{name}},\n\nI noticed {{business}} in {{city}} could benefit from a modern web presence.\n\nWould you be open to a short call this week?',
    channel: 'email',
    opportunityType: '' as OpportunityType,
  });

  const loadLeads = () =>
    api<{ leads: LeadRow[]; ownerScope: string }>('/api/crm/leads').then((d) => {
      setLeads(d.leads);
      setOwnerScope(d.ownerScope);
    });

  const loadTemplates = () =>
    api<{ templates: Template[] }>('/api/outreach/templates').then((d) => {
      setTemplates(d.templates);
      if (!exportTemplateId && d.templates[0]) setExportTemplateId(d.templates[0].id);
    });

  useEffect(() => {
    loadTemplates().catch(console.error);
    loadLeads().catch(console.error);
  }, []);

  const filteredLeads = useMemo(
    () => leads.filter((l) => statusFilter.includes(l.lead.status)),
    [leads, statusFilter],
  );

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/api/outreach/templates', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        opportunityType: form.opportunityType || null,
      }),
    });
    await loadTemplates();
  };

  const templatesByType = useMemo(() => {
    const grouped: Record<string, Template[]> = { untyped: [] };
    for (const t of templates) {
      const key = t.opportunityType ?? 'untyped';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    }
    return grouped;
  }, [templates]);

  const downloadExport = async () => {
    if (!exportTemplateId) return;
    setExportMsg(null);
    setExportError(null);

    const params = new URLSearchParams({
      templateId: exportTemplateId,
      date: 'today',
    });
    if (includeUnreviewedExport) params.set('includeUnreviewed', 'true');

    const headers: Record<string, string> = {
      'X-Dev-User': 'operator',
    };
    if (includeUnreviewedExport) {
      headers['X-Confirm-Unreviewed'] = 'true';
    }

    try {
      const res = await fetch(`/api/outreach/export?${params}`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Export failed',
        );
      }
      const blob = await res.blob();
      const count = res.headers.get('X-Export-Count') ?? '?';
      const skippedContact = res.headers.get('X-Export-Skipped-No-Contact') ?? '0';
      const skippedSuppressed = res.headers.get('X-Export-Skipped-Suppressed') ?? '0';
      const skippedReachability = res.headers.get('X-Export-Skipped-Reachability') ?? '0';
      const minReach = res.headers.get('X-Export-Min-Reachability') ?? 'low';
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? 'outreach-export.csv';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setExportMsg(
        `Exported ${count} row(s). Skipped ${skippedContact} without contact, ${skippedSuppressed} suppressed, ${skippedReachability} below ${minReach} reachability.`,
      );
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    }
  };

  const selectedLead = filteredLeads.find((l) => l.lead.id === selectedLeadId);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <PageHeader title={PAGE_COPY.outreach.title} description={PAGE_COPY.outreach.description} />
        {ownerScope !== 'all' && (
          <p className="text-xs text-slate-500 -mt-4 mb-2">
            Showing your pursuits only (owner scope). Add <code>?owner=all</code> to API for all operators.
          </p>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-950">
        <p className="font-medium">Safety gates</p>
        <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-900">
          <li>CSV export defaults to REVIEWED + CONTACTED only (not NEW)</li>
          <li>Rows without email and phone are excluded</li>
          <li>Suppressed accounts are never exported or sent</li>
          <li>Reachability below your ICP minimum (Settings) is excluded from export</li>
        </ul>
      </div>

      <form onSubmit={saveTemplate} className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">New template</h3>
        <p className="text-xs text-slate-500">
          Tokens: {'{{name}}'}, {'{{business}}'}, {'{{city}}'}, {'{{website}}'}. Default templates
          auto-seed per opportunity type on first load.
        </p>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={form.opportunityType}
          onChange={(e) =>
            setForm({ ...form, opportunityType: e.target.value as OpportunityType })
          }
        >
          <option value="">No opportunity type (generic)</option>
          <option value="demand_response">Demand response</option>
          <option value="greenfield">Greenfield site</option>
          <option value="redesign">Redesign</option>
          <option value="modernize">Modernize</option>
          <option value="general">General fit</option>
        </select>
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Template name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <textarea
          className="w-full border rounded-md px-3 py-2 text-sm h-24"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md text-sm">
          Save template
        </button>
      </form>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium mb-3">Templates by opportunity type ({templates.length})</h3>
        {templates.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Loading templates…</p>
        ) : (
          <div className="space-y-4 text-sm">
            {(
              [
                'demand_response',
                'greenfield',
                'redesign',
                'modernize',
                'general',
                'untyped',
              ] as const
            ).map((type) => {
              const list = templatesByType[type];
              if (!list?.length) return null;
              return (
                <div key={type}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                    {type === 'untyped' ? 'Other' : type.replace(/_/g, ' ')}
                  </p>
                  <ul className="space-y-2">
                    {list.map((t) => (
                      <li key={t.id} className="border-b border-slate-100 pb-2 last:border-0">
                        <strong>{t.name}</strong> — {t.channel}
                        {t.subject && <span className="text-slate-500"> · {t.subject}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-medium">Operator workflow</h3>

        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Lead status filter (compose list)</p>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUS_FILTERS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(s)}
                  onChange={() => toggleStatus(s)}
                />
                {s}
                {s === 'NEW' && (
                  <span className="text-xs text-amber-700">(not in default export)</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <select
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={selectedLeadId}
          onChange={(e) => setSelectedLeadId(e.target.value)}
        >
          <option value="">Select lead…</option>
          {filteredLeads.map((l) => (
            <option key={l.lead.id} value={l.lead.id}>
              {l.business.name} — {l.lead.status} ({l.lead.priority})
            </option>
          ))}
        </select>

        {selectedLeadId && selectedLead && (
          <OutreachCompose
            leadId={selectedLeadId}
            leadLabel={`${selectedLead.business.name} (${selectedLead.lead.status})`}
            onRecorded={() => {
              loadLeads().catch(console.error);
            }}
          />
        )}

        {!selectedLeadId && (
          <p className="text-sm text-slate-500 italic">
            Select a lead to preview merged copy and record outreach.
          </p>
        )}
      </div>

      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-medium">CSV export</h3>
        <p className="text-sm text-slate-600">
          Export today&apos;s batch: REVIEWED + CONTACTED leads not yet contacted today, with merged
          subject, body, email, phone, and Maps URL. NEW leads are excluded unless you opt in below.
        </p>
        <select
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={exportTemplateId}
          onChange={(e) => setExportTemplateId(e.target.value)}
        >
          <option value="">Select template for export…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.opportunityType ? ` · ${t.opportunityType.replace(/_/g, ' ')}` : ''}
            </option>
          ))}
        </select>
        <label className="flex items-start gap-2 text-sm text-amber-900">
          <input
            type="checkbox"
            className="mt-1"
            checked={includeUnreviewedExport}
            onChange={(e) => setIncludeUnreviewedExport(e.target.checked)}
          />
          <span>
            Include unreviewed NEW leads in export
            <span className="block text-xs text-amber-800">
              Requires explicit confirmation — only use for research lanes, not default outreach.
            </span>
          </span>
        </label>
        {exportMsg && (
          <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2">
            {exportMsg}
          </p>
        )}
        {exportError && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            {exportError}
          </p>
        )}
        <button
          type="button"
          onClick={downloadExport}
          disabled={!exportTemplateId}
          className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          Download CSV (today)
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Or open a lead hub for inline compose:{' '}
        <Link href="/leads" className="text-brand-600 hover:underline">
          Leads list
        </Link>
      </p>
    </div>
  );
}
