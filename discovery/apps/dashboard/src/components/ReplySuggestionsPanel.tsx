'use client';

import { api } from '@/lib/api';

type Suggestion = {
  id: string;
  subject: string | null;
  snippet: string | null;
  fromEmail: string | null;
  receivedAt: string | null;
};

type Props = {
  leadId: string;
  suggestions: Suggestion[];
  onDone: () => void;
};

export function ReplySuggestionsPanel({ leadId, suggestions, onDone }: Props) {
  if (suggestions.length === 0) return null;

  const act = async (suggestionId: string, action: 'confirm' | 'dismiss') => {
    await api(`/api/crm/leads/${leadId}/reply-suggestions/${suggestionId}/${action}`, {
      method: 'POST',
    });
    onDone();
  };

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 space-y-3">
      <h3 className="font-medium text-sky-900">Possible reply detected (Gmail)</h3>
      {suggestions.map((s) => (
        <div key={s.id} className="bg-white border border-sky-100 rounded p-3 text-sm">
          <p className="font-medium text-slate-900">{s.subject || '(no subject)'}</p>
          {s.fromEmail && <p className="text-xs text-slate-500 mt-0.5">From {s.fromEmail}</p>}
          {s.snippet && <p className="text-slate-700 mt-2 whitespace-pre-wrap">{s.snippet}</p>}
          {s.receivedAt && (
            <p className="text-xs text-slate-400 mt-1">
              {new Date(s.receivedAt).toLocaleString()}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => act(s.id, 'confirm')}
              className="bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700"
            >
              Confirm → REPLIED
            </button>
            <button
              type="button"
              onClick={() => act(s.id, 'dismiss')}
              className="border border-slate-300 text-slate-700 px-3 py-1 rounded text-xs hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
