'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  leadId: string;
  onDone: () => void;
  compact?: boolean;
};

export function MarkRepliedForm({ leadId, onDone, compact }: Props) {
  const [note, setNote] = useState('');
  const [channel, setChannel] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      await api(`/api/crm/leads/${leadId}/mark-replied`, {
        method: 'POST',
        body: JSON.stringify({
          note: note.trim() || undefined,
          channel,
        }),
      });
      setNote('');
      onDone();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Mark replied'}
        </button>
        {error && <p className="text-xs text-red-600 max-w-[12rem] text-right">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
      <h3 className="font-medium text-emerald-900 mb-2">Mark replied</h3>
      <p className="text-xs text-emerald-800 mb-3">
        Records that the prospect responded and moves the lead to REPLIED.
      </p>
      <label className="block text-xs text-emerald-900 mb-1">Channel</label>
      <select
        className="w-full border rounded-md px-3 py-2 text-sm mb-2 bg-white"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
      >
        <option value="email">Email</option>
        <option value="linkedin">LinkedIn</option>
        <option value="phone">Phone</option>
        <option value="other">Other</option>
      </select>
      <label className="block text-xs text-emerald-900 mb-1">Note (optional)</label>
      <textarea
        className="w-full border rounded-md px-3 py-2 text-sm mb-2 bg-white"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Summary of their reply…"
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full bg-emerald-600 text-white py-2 rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'They replied → REPLIED'}
      </button>
    </div>
  );
}
