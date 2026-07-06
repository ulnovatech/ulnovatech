'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type PasteForm = {
  sourceUrl: string;
  title: string;
  snippet: string;
  signalType: string;
  city: string;
  country: string;
};

export default function IntentInboxPage() {
  const [form, setForm] = useState<PasteForm>({
    sourceUrl: '',
    title: '',
    snippet: '',
    signalType: 'help_request',
    city: '',
    country: '',
  });
  const [feeds, setFeeds] = useState(['', '', '']);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ intent: { demandRssFeeds: string[] } }>('/api/settings')
      .then((d) => {
        const list = d.intent?.demandRssFeeds ?? [];
        setFeeds([list[0] ?? '', list[1] ?? '', list[2] ?? '']);
      })
      .catch(() => {});
  }, []);

  const saveFeeds = async () => {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await api('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          intent: { demandRssFeeds: feeds.filter((f) => f.trim()) },
        }),
      });
      setMsg('RSS feeds saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save feeds');
    } finally {
      setBusy(false);
    }
  };

  const pollRss = async () => {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const result = await api<{ created: number; skipped: number; polled: number; errors: string[] }>(
        '/api/intent/rss/poll',
        { method: 'POST' },
      );
      setMsg(
        `Polled ${result.polled} feed(s): ${result.created} new demand signal(s), ${result.skipped} duplicate(s).`,
      );
      if (result.errors.length) setError(result.errors.join('; '));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RSS poll failed');
    } finally {
      setBusy(false);
    }
  };

  const submitPaste = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const result = await api<{ created: boolean; matchedBusinessId: string | null }>(
        '/api/intent/paste',
        {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            snippet: form.snippet || undefined,
            city: form.city || undefined,
            country: form.country || undefined,
          }),
        },
      );
      setMsg(
        result.created
          ? result.matchedBusinessId
            ? 'Demand signal created and matched to an existing business.'
            : 'Demand signal created — process it in the demand inbox.'
          : 'Duplicate URL — signal already exists.',
      );
      if (result.created) {
        setForm({ ...form, sourceUrl: '', title: '', snippet: '' });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Paste ingest failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <PageHeader title={PAGE_COPY.addDemand.title} description={PAGE_COPY.addDemand.description} />
        <Link href="/intent/inbox" className="text-sm text-brand-700 hover:underline shrink-0">
          Demand inbox →
        </Link>
      </div>

      {msg && (
        <p className="mb-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded p-3">{msg}</p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}

      <form onSubmit={submitPaste} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 mb-8">
        <h3 className="font-semibold text-slate-900">Paste demand signal</h3>
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          placeholder="Source URL (required)"
          value={form.sourceUrl}
          onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
          required
        />
        <input
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          placeholder="Title / headline"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
          rows={4}
          placeholder="Snippet / description (optional)"
          value={form.snippet}
          onChange={(e) => setForm({ ...form, snippet: e.target.value })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            className="border border-slate-300 rounded px-3 py-2 text-sm"
            value={form.signalType}
            onChange={(e) => setForm({ ...form, signalType: e.target.value })}
          >
            <option value="help_request">Help request</option>
            <option value="public_request">Public request</option>
            <option value="hiring">Hiring</option>
            <option value="job_post">Job post</option>
            <option value="other">Other</option>
          </select>
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="City (optional)"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <input
            className="border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder="Country (optional)"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Add demand signal'}
        </button>
      </form>

      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-slate-900">RSS demand feeds</h3>
        <p className="text-sm text-slate-600">
          Up to 3 RSS/Atom URLs (job boards, community feeds, etc.). Poll manually or schedule{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">pnpm intent:rss-poll</code> daily.
        </p>
        {feeds.map((feed, i) => (
          <input
            key={i}
            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
            placeholder={`Feed URL ${i + 1}`}
            value={feed}
            onChange={(e) => {
              const next = [...feeds];
              next[i] = e.target.value;
              setFeeds(next);
            }}
          />
        ))}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveFeeds}
            disabled={busy}
            className="border border-slate-300 px-4 py-2 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            Save feeds
          </button>
          <button
            type="button"
            onClick={pollRss}
            disabled={busy}
            className="border border-brand-300 text-brand-700 px-4 py-2 rounded-md text-sm hover:bg-brand-50 disabled:opacity-50"
          >
            Poll now
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 mt-8">
        <h3 className="font-semibold text-slate-900">Reddit custom scrape (Tier 5)</h3>
        <p className="text-sm text-slate-600">
          Polls public Reddit JSON for demand signals only — no bulk account creation. Requires{' '}
          <code className="text-xs bg-slate-100 px-1 rounded">CUSTOM_SCRAPE_ENABLED=true</code>.
          Rate limit 1 req/5s; daily cap from Settings.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            setMsg(null);
            try {
              const result = await api<{
                skipped?: boolean;
                reason?: string;
                polled: number;
                created: number;
                skippedDupes: number;
                errors: string[];
              }>('/api/intent/custom-scrape/poll', { method: 'POST' });
              if (result.skipped) {
                setMsg(`Skipped: ${result.reason ?? 'disabled'}`);
              } else {
                setMsg(
                  `Polled ${result.polled} subreddit(s): ${result.created} new demand signal(s), ${result.skippedDupes} duplicate(s).`,
                );
              }
              if (result.errors?.length) setError(result.errors.join('; '));
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Custom scrape poll failed');
            } finally {
              setBusy(false);
            }
          }}
          className="border border-brand-300 text-brand-700 px-4 py-2 rounded-md text-sm hover:bg-brand-50 disabled:opacity-50"
        >
          Poll Reddit now
        </button>
      </section>
    </div>
  );
}
