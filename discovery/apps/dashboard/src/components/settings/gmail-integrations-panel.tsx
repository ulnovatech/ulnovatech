'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Props = {
  hasClientCredentials: boolean;
};

export function GmailIntegrationsPanel({ hasClientCredentials }: Props) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () =>
    api<{ connected: boolean }>('/api/integrations/gmail/status')
      .then((d) => setConnected(d.connected))
      .catch(() => setConnected(false))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (hasClientCredentials) load();
    else setLoading(false);
  }, [hasClientCredentials]);

  if (!hasClientCredentials) return null;

  const sync = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await api<{ scanned: number; created: number }>(
        '/api/integrations/gmail/sync-replies',
        { method: 'POST', body: JSON.stringify({ days: 7 }) },
      );
      setMessage(`Scanned ${result.scanned} messages — ${result.created} new suggestion(s).`);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const disconnect = async () => {
    setMessage(null);
    try {
      await api('/api/integrations/gmail/disconnect', { method: 'POST' });
      setConnected(false);
      setMessage('Gmail disconnected.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Disconnect failed');
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-slate-900">Gmail reply suggestions</h3>
      <p className="text-sm text-slate-600">
        Read-only Gmail access to surface possible prospect replies on lead hubs. No send scope;
        operators confirm before moving leads to REPLIED.
      </p>
      {loading ? (
        <p className="text-sm text-slate-500">Checking connection…</p>
      ) : (
        <p className="text-sm">
          Status:{' '}
          <strong className={connected ? 'text-emerald-700' : 'text-slate-700'}>
            {connected ? 'Connected' : 'Not connected'}
          </strong>
        </p>
      )}
      {message && <p className="text-sm text-slate-700">{message}</p>}
      <div className="flex flex-wrap gap-2">
        {!connected && (
          <a
            href="/api/integrations/gmail/connect"
            className="inline-flex bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-brand-700"
          >
            Connect Gmail (read-only)
          </a>
        )}
        {connected && (
          <>
            <button
              type="button"
              onClick={sync}
              disabled={syncing}
              className="bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing…' : 'Sync replies now'}
            </button>
            <button
              type="button"
              onClick={disconnect}
              className="border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-sm hover:bg-slate-50"
            >
              Disconnect
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Redirect URI for Google Cloud console:{' '}
        <code className="bg-slate-100 px-1 rounded">
          {typeof window !== 'undefined'
            ? `${window.location.origin}/api/integrations/gmail/callback`
            : '/api/integrations/gmail/callback'}
        </code>
      </p>
    </section>
  );
}
