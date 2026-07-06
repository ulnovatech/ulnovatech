'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type SuppressionEntry = {
  id: string;
  email: string | null;
  phone: string | null;
  domain: string | null;
  reason: string | null;
  createdAt: string;
};

export function SuppressionListPanel() {
  const [entries, setEntries] = useState<SuppressionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', phone: '', domain: '', reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ entries: SuppressionEntry[] }>('/api/accounts/suppression');
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load suppression list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api('/api/accounts/suppression', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email || undefined,
          phone: form.phone || undefined,
          domain: form.domain || undefined,
          reason: form.reason || undefined,
        }),
      });
      setForm({ email: '', phone: '', domain: '', reason: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm('Remove this suppression entry?')) return;
    setError(null);
    try {
      await api(`/api/accounts/suppression?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove entry');
    }
  };

  return (
    <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">Suppression list</h3>
        <p className="text-sm text-slate-600 mt-1">
          Block outreach and export for matching emails, phones, or domains. Rejecting from the
          review queue sets the account flag; use this list for competitors and do-not-contact
          rules.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <form onSubmit={addEntry} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm block">
          <span className="text-slate-700">Email</span>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="competitor@example.com"
          />
        </label>
        <label className="text-sm block">
          <span className="text-slate-700">Phone</span>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+256..."
          />
        </label>
        <label className="text-sm block">
          <span className="text-slate-700">Domain</span>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            placeholder="competitor.com"
          />
        </label>
        <label className="text-sm block">
          <span className="text-slate-700">Reason</span>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="Competitor / asked to opt out"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add to suppression list'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading entries…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-500">No suppression entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-slate-600 border-b border-slate-200">
                <th className="py-2 pr-3 font-medium">Email</th>
                <th className="py-2 pr-3 font-medium">Phone</th>
                <th className="py-2 pr-3 font-medium">Domain</th>
                <th className="py-2 pr-3 font-medium">Reason</th>
                <th className="py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs">{entry.email ?? '—'}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{entry.phone ?? '—'}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{entry.domain ?? '—'}</td>
                  <td className="py-2 pr-3 text-slate-600">{entry.reason ?? '—'}</td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="text-red-700 hover:underline text-xs"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
