'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BOI_COPY } from '@/lib/product-copy';

type Template = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  channel: string;
  opportunityType?: string | null;
};

type Preview = {
  subject: string | null;
  body: string;
  channel: string;
  business: string;
  leadStatus: string;
  openerApplied?: boolean;
};

type OpenerEvidence = {
  id: string;
  label: string;
  excerpt?: string | null;
};

type Recommended = {
  opportunityType: string;
  opportunityTypeLabel: string;
  pitchAngle: string;
  template: { id: string; name: string; opportunityType: string | null } | null;
  suggestedOpener?: string | null;
  openerPainId?: string | null;
  openerPainLabel?: string | null;
  openerEvidence?: OpenerEvidence[];
};

type Props = {
  leadId: string;
  leadLabel?: string;
  onRecorded?: () => void;
};

export function OutreachCompose({ leadId, leadLabel, onRecorded }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [recommended, setRecommended] = useState<Recommended | null>(null);
  const [openerDraft, setOpenerDraft] = useState('');
  const [openerEnabled, setOpenerEnabled] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [recordStatus, setRecordStatus] = useState('');

  useEffect(() => {
    api<{ templates: Template[] }>('/api/outreach/templates')
      .then((d) => setTemplates(d.templates))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!leadId) return;
    api<Recommended>(`/api/outreach/templates/recommended?leadId=${encodeURIComponent(leadId)}`)
      .then((d) => {
        setRecommended(d);
        if (d.template?.id) setTemplateId(d.template.id);
        if (d.suggestedOpener) {
          setOpenerDraft(d.suggestedOpener);
          setOpenerEnabled(true);
        } else {
          setOpenerDraft('');
          setOpenerEnabled(false);
        }
      })
      .catch(() => setRecommended(null));
  }, [leadId]);

  useEffect(() => {
    if (!leadId || !templateId) {
      setPreview(null);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({
      leadId,
      templateId,
    });
    if (openerEnabled && openerDraft.trim()) {
      params.set('opener', openerDraft);
    }
    api<{ preview: Preview }>(`/api/outreach/preview?${params}`)
      .then((d) => setPreview(d.preview))
      .catch(() => setPreview(null))
      .finally(() => setLoading(false));
  }, [leadId, templateId, openerDraft, openerEnabled]);

  const copyToClipboard = async () => {
    if (!preview) return;
    const text = [preview.subject ? `Subject: ${preview.subject}` : null, preview.body]
      .filter(Boolean)
      .join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopyStatus('Copied');
    setTimeout(() => setCopyStatus(''), 2000);
  };

  const recordOutreach = async () => {
    if (!preview) return;
    setRecordStatus('Saving…');
    try {
      await api('/api/outreach/messages', {
        method: 'POST',
        body: JSON.stringify({
          leadId,
          templateId,
          subject: preview.subject ?? undefined,
          body: preview.body,
          channel: preview.channel,
          markContacted: true,
        }),
      });
      setRecordStatus('Recorded — marked CONTACTED');
      onRecorded?.();
    } catch (e) {
      setRecordStatus(e instanceof Error ? e.message : 'Failed to record');
    }
  };

  const hasBoiOpener = !!(recommended?.suggestedOpener || recommended?.openerPainLabel);

  return (
    <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
      {leadLabel && <p className="text-sm font-medium text-slate-800">{leadLabel}</p>}

      {recommended && (
        <div className="text-xs bg-brand-50 border border-brand-100 rounded px-3 py-2 text-brand-950">
          <span className="font-semibold">{recommended.opportunityTypeLabel}</span>
          <span className="text-brand-800"> — {recommended.pitchAngle}</span>
        </div>
      )}

      {hasBoiOpener && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-violet-900">
              {BOI_COPY.productName} · personalized opener
            </p>
            <label className="flex items-center gap-1.5 text-xs text-violet-800">
              <input
                type="checkbox"
                checked={openerEnabled}
                onChange={(e) => setOpenerEnabled(e.target.checked)}
                className="rounded border-violet-300"
              />
              Include in message
            </label>
          </div>
          {recommended?.openerPainLabel && (
            <p className="text-[10px] text-violet-700">
              Based on pain: {recommended.openerPainLabel}
            </p>
          )}
          <textarea
            className="w-full min-h-[88px] text-sm border border-violet-200 rounded-md px-3 py-2 bg-white text-slate-800 leading-relaxed resize-y"
            value={openerDraft}
            onChange={(e) => setOpenerDraft(e.target.value)}
            disabled={!openerEnabled}
            placeholder="Personalized opening paragraph…"
          />
          {(recommended?.openerEvidence?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 mb-1">
                Evidence cited
              </p>
              <ul className="space-y-1">
                {recommended!.openerEvidence!.map((ev) => (
                  <li
                    key={ev.id}
                    className="text-[11px] text-violet-900/90 border-l-2 border-violet-200 pl-2"
                  >
                    <span className="font-medium">{ev.label}</span>
                    {ev.excerpt && (
                      <span className="block text-violet-700/80 italic mt-0.5">
                        &ldquo;{ev.excerpt.length > 100 ? `${ev.excerpt.slice(0, 97)}…` : ev.excerpt}&rdquo;
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <select
        className="w-full border rounded-md px-3 py-2 text-sm bg-white"
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
      >
        <option value="">Select template…</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.opportunityType ? ` (${t.opportunityType.replace('_', ' ')})` : ''}
          </option>
        ))}
      </select>

      {loading && <p className="text-sm text-slate-500">Loading preview…</p>}

      {preview && (
        <div className="bg-white border rounded-md p-3 text-sm space-y-2">
          {preview.subject && (
            <p>
              <span className="text-slate-500">Subject:</span> {preview.subject}
            </p>
          )}
          <pre className="whitespace-pre-wrap font-sans text-slate-800">{preview.body}</pre>
          <p className="text-xs text-slate-500">
            {preview.business} · {preview.leadStatus}
            {preview.openerApplied && ' · BOI opener included'}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyToClipboard}
          disabled={!preview}
          className="border border-slate-300 px-3 py-2 rounded-md text-sm hover:bg-white disabled:opacity-50"
        >
          Copy message
        </button>
        <button
          type="button"
          onClick={recordOutreach}
          disabled={!preview}
          className="bg-brand-600 text-white px-3 py-2 rounded-md text-sm hover:bg-brand-700 disabled:opacity-50"
        >
          Record outreach (sent externally)
        </button>
        {copyStatus && <span className="text-sm text-green-700 self-center">{copyStatus}</span>}
        {recordStatus && (
          <span className="text-sm text-slate-600 self-center">{recordStatus}</span>
        )}
      </div>

      {!templateId && templates.length === 0 && (
        <p className="text-sm text-slate-500 italic">Loading templates…</p>
      )}
    </div>
  );
}
