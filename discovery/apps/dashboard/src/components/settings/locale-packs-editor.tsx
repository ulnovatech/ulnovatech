'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type ExternalResource = {
  name: string;
  url: string;
  description: string;
};

export type LocalePackToken = { token: string; weight?: number };

export type LocalePack = {
  id: string;
  name: string;
  languageCode?: string;
  markets: string[];
  contactTokens: LocalePackToken[];
  aboutTokens: LocalePackToken[];
  negativeTokens: LocalePackToken[];
  enabled: boolean;
  notes?: string;
  source?: string;
};

export type LocaleSettings = {
  useBuiltinLexicon: boolean;
  packs: LocalePack[];
};

function tokensToLines(tokens: LocalePackToken[]): string {
  return tokens.map((t) => (t.weight != null ? `${t.token}:${t.weight}` : t.token)).join('\n');
}

function linesToTokens(text: string): LocalePackToken[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [token, weightRaw] = line.split(':').map((s) => s.trim());
      const weight = weightRaw ? parseInt(weightRaw, 10) : undefined;
      return { token, weight: Number.isFinite(weight) ? weight : undefined };
    })
    .filter((t) => t.token);
}

function newPack(): LocalePack {
  return {
    id: crypto.randomUUID(),
    name: 'New market pack',
    markets: [],
    contactTokens: [],
    aboutTokens: [],
    negativeTokens: [],
    enabled: true,
  };
}

type Props = {
  locales: LocaleSettings;
  onChange: (next: LocaleSettings) => void;
};

export function LocalePacksEditor({ locales, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);

  useEffect(() => {
    fetch('/api/settings/locales/resources')
      .then((r) => r.json())
      .then((d: { resources: ExternalResource[] }) => setExternalResources(d.resources ?? []))
      .catch(() => setExternalResources([]));
  }, []);

  const updatePack = (id: string, patch: Partial<LocalePack>) => {
    onChange({
      ...locales,
      packs: locales.packs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  };

  const removePack = (id: string) => {
    onChange({ ...locales, packs: locales.packs.filter((p) => p.id !== id) });
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    setImportMsg(null);
    try {
      const content = await file.text();
      const format = file.name.endsWith('.json') ? 'json' : 'doc';
      await importLocaleContent(content, format, 'Imported pack(s). Save settings to persist.');
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const importLocaleContent = async (content: string, format: 'json' | 'doc', successMsg: string) => {
    const result = await api<{ imported: number; packs: LocalePack[] }>(
      '/api/settings/locales/import',
      {
        method: 'POST',
        body: JSON.stringify({ format, content, merge: true }),
      },
    );
    onChange({ ...locales, packs: result.packs });
    setImportMsg(successMsg);
  };

  const loadBuiltin = async () => {
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch('/api/settings/locales/builtin?format=json');
      const content = await res.text();
      await importLocaleContent(
        content,
        'json',
        'Loaded built-in lexicon as an editable pack. Enable it to fork off the global toggle, then Save.',
      );
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Failed to load built-in lexicon');
    } finally {
      setImporting(false);
    }
  };

  const loadStarters = async () => {
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await fetch('/api/settings/locales/starters');
      const content = await res.text();
      await importLocaleContent(
        content,
        'json',
        'Added starter pack(s). Enable the ones you need, then Save.',
      );
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : 'Failed to load starters');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-slate-900">Market &amp; language packs</h3>
        <p className="text-sm text-slate-600 mt-1">
          Extend crawl link discovery for your target markets. Download the built-in lexicon, import
          JSON/text packs, upload edited docs, or add tokens manually.
        </p>
      </div>

      {externalResources.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700 mb-2">External locale resources</p>
          <ul className="space-y-1.5 text-sm">
            {externalResources.map((r) => (
              <li key={r.url}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline font-medium"
                >
                  {r.name}
                </a>
                <span className="text-slate-600"> — {r.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={locales.useBuiltinLexicon}
          onChange={(e) => onChange({ ...locales, useBuiltinLexicon: e.target.checked })}
        />
        <span className="text-slate-700">Include built-in multilingual lexicon (EN/FR/DE/ES/SW…)</span>
      </label>

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href="/api/settings/locales/template"
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50"
          download
        >
          Download .txt template
        </a>
        <a
          href="/api/settings/locales/builtin?format=json"
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50"
          download
        >
          Built-in lexicon (.json)
        </a>
        <a
          href="/api/settings/locales/builtin?format=doc"
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50"
          download
        >
          Built-in lexicon (.txt)
        </a>
        <button
          type="button"
          onClick={loadBuiltin}
          disabled={importing}
          className="px-3 py-1.5 border border-brand-300 text-brand-700 rounded-md hover:bg-brand-50 disabled:opacity-50"
        >
          Load built-in into account
        </button>
        <a
          href="/api/settings/locales/starters"
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50"
          download
        >
          Starter packs (.json)
        </a>
        <button
          type="button"
          onClick={loadStarters}
          disabled={importing}
          className="px-3 py-1.5 border border-brand-300 text-brand-700 rounded-md hover:bg-brand-50 disabled:opacity-50"
        >
          Load starters into account
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
        >
          Upload pack…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.txt,.md,text/plain,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => onChange({ ...locales, packs: [...locales.packs, newPack()] })}
          className="px-3 py-1.5 bg-slate-100 rounded-md hover:bg-slate-200"
        >
          + Add pack
        </button>
      </div>

      {importMsg && (
        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">
          {importMsg}
        </p>
      )}

      <div className="space-y-3">
        {locales.packs.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            No custom packs yet — built-in lexicon still applies if enabled above.
          </p>
        )}
        {locales.packs.map((pack) => (
          <div key={pack.id} className="border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="flex-1 min-w-[12rem] border border-slate-300 rounded px-2 py-1 text-sm font-medium"
                value={pack.name}
                onChange={(e) => updatePack(pack.id, { name: e.target.value })}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={pack.enabled}
                  onChange={(e) => updatePack(pack.id, { enabled: e.target.checked })}
                />
                Enabled
              </label>
              <a
                href={`/api/settings/locales/export/${pack.id}?format=json`}
                className="text-xs text-brand-600 hover:underline"
                download
              >
                JSON
              </a>
              <a
                href={`/api/settings/locales/export/${pack.id}?format=doc`}
                className="text-xs text-brand-600 hover:underline"
                download
              >
                .txt
              </a>
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === pack.id ? null : pack.id)}
                className="text-xs text-slate-600 hover:underline"
              >
                {expandedId === pack.id ? 'Collapse' : 'Edit tokens'}
              </button>
              <button
                type="button"
                onClick={() => removePack(pack.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <input
                placeholder="Language code (ar, hi, sw)"
                className="border border-slate-300 rounded px-2 py-1"
                value={pack.languageCode ?? ''}
                onChange={(e) => updatePack(pack.id, { languageCode: e.target.value || undefined })}
              />
              <input
                placeholder="Markets (comma-separated)"
                className="sm:col-span-2 border border-slate-300 rounded px-2 py-1"
                value={pack.markets.join(', ')}
                onChange={(e) =>
                  updatePack(pack.id, {
                    markets: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            {expandedId === pack.id && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="block text-xs">
                  <span className="text-slate-700 font-medium">Contact tokens (one per line, optional :weight)</span>
                  <textarea
                    rows={6}
                    className="mt-1 w-full border border-slate-300 rounded font-mono text-xs p-2"
                    value={tokensToLines(pack.contactTokens)}
                    onChange={(e) =>
                      updatePack(pack.id, { contactTokens: linesToTokens(e.target.value) })
                    }
                  />
                </label>
                <label className="block text-xs">
                  <span className="text-slate-700 font-medium">About tokens</span>
                  <textarea
                    rows={6}
                    className="mt-1 w-full border border-slate-300 rounded font-mono text-xs p-2"
                    value={tokensToLines(pack.aboutTokens)}
                    onChange={(e) =>
                      updatePack(pack.id, { aboutTokens: linesToTokens(e.target.value) })
                    }
                  />
                </label>
              </div>
            )}
            <p className="text-xs text-slate-500">
              {pack.contactTokens.length} contact · {pack.aboutTokens.length} about tokens
              {pack.source ? ` · source: ${pack.source}` : ''}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
