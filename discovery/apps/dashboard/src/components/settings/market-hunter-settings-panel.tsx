'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  PLATFORM_LABELS,
  PLATFORM_CONFIG,
  type MarketHunterPlatformKey,
} from '@agency/market-hunter/ui-meta';

type MarketHunterLlmSettings = {
  researchProvider: 'openrouter' | 'xai';
  researchModel: string;
  complaintsProvider: 'openrouter' | 'anthropic';
  complaintsModel: string;
};

type MarketHunterCostEstimates = {
  researchListingCallUsd: number;
  researchReviewsCallUsd: number;
  complaintAnalysisCallUsd: number;
};

type MarketHunterSettings = {
  enabled: boolean;
  maxSpendPerRunUsd: number;
  defaultListingLimit: number;
  scheduleCron: string;
  platforms: Record<MarketHunterPlatformKey, boolean>;
  platformCategories: Partial<Record<MarketHunterPlatformKey, string[]>>;
  llm: MarketHunterLlmSettings;
  costEstimates: MarketHunterCostEstimates;
  paymentPath: string;
};

type CredentialMeta = {
  key: string;
  label: string;
  envVar: string;
  configured: boolean;
  source: string;
  hasStoredValue: boolean;
};

const PLATFORM_KEYS = Object.keys(PLATFORM_LABELS) as MarketHunterPlatformKey[];

const HUNTER_CREDENTIAL_KEYS = ['openrouter_api_key', 'xai_grok_api_key', 'anthropic_api_key'];

const RESEARCH_MODEL_HINTS: Record<'openrouter' | 'xai', string> = {
  openrouter: 'e.g. perplexity/sonar, x-ai/grok-3, openai/gpt-4o',
  xai: 'e.g. grok-3, grok-2-1212',
};

const COMPLAINTS_MODEL_HINTS: Record<'openrouter' | 'anthropic', string> = {
  openrouter: 'e.g. anthropic/claude-sonnet-4, openai/gpt-4o-mini',
  anthropic: 'e.g. claude-sonnet-4-20250514, claude-3-5-sonnet-20241022',
};

function categoriesToText(categories: string[] | undefined): string {
  return (categories ?? []).join('\n');
}

function textToCategories(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function defaultCategoriesFor(key: MarketHunterPlatformKey): string[] {
  return PLATFORM_CONFIG[key].categories;
}

export function MarketHunterSettingsPanel() {
  const [mh, setMh] = useState<MarketHunterSettings | null>(null);
  const [credentials, setCredentials] = useState<CredentialMeta[]>([]);
  const [credentialValues, setCredentialValues] = useState<Record<string, string>>({});
  const [categoryText, setCategoryText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api<{ marketHunter: MarketHunterSettings; credentials: CredentialMeta[] }>('/api/settings')
      .then((d) => {
        setMh(d.marketHunter);
        setCredentials(d.credentials.filter((c) => HUNTER_CREDENTIAL_KEYS.includes(c.key)));
        const texts: Record<string, string> = {};
        for (const key of PLATFORM_KEYS) {
          const custom = d.marketHunter.platformCategories?.[key];
          texts[key] = categoriesToText(custom?.length ? custom : defaultCategoriesFor(key));
        }
        setCategoryText(texts);
      })
      .catch((e) => setMessage(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const scheduleEndpoint = useMemo(() => {
    if (typeof window === 'undefined') return '/api/market-hunter/scans/scheduled';
    return `${window.location.origin}/api/market-hunter/scans/scheduled`;
  }, []);

  async function save() {
    if (!mh) return;
    setSaving(true);
    setMessage(null);

    const platformCategories: Partial<Record<MarketHunterPlatformKey, string[]>> = {};
    for (const key of PLATFORM_KEYS) {
      const parsed = textToCategories(categoryText[key] ?? '');
      const defaults = defaultCategoriesFor(key);
      const differs =
        parsed.length !== defaults.length || parsed.some((c, i) => c !== defaults[i]);
      if (differs && parsed.length > 0) {
        platformCategories[key] = parsed;
      }
    }

    const credPatch: Record<string, string> = {};
    for (const key of HUNTER_CREDENTIAL_KEYS) {
      const val = credentialValues[key]?.trim();
      if (val) credPatch[key] = val;
    }

    try {
      await api('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          marketHunter: { ...mh, platformCategories },
          ...(Object.keys(credPatch).length ? { credentials: credPatch } : {}),
        }),
      });
      setCredentialValues({});
      setMessage('Market Hunter settings saved.');
    } catch (e) {
      setMessage(String(e));
    } finally {
      setSaving(false);
    }
  }

  function resetCategories(key: MarketHunterPlatformKey) {
    setCategoryText((prev) => ({ ...prev, [key]: categoriesToText(defaultCategoriesFor(key)) }));
  }

  if (loading) {
    return (
      <section className="bg-white border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-slate-500">Loading Market Hunter settings…</p>
      </section>
    );
  }

  if (!mh) return null;

  return (
    <section className="bg-white border border-amber-200 rounded-lg p-4 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">Live Market Hunter</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Product gap scans — separate from agency lead discovery. Configure LLMs, platforms,
            categories, and API keys here in one save. Open the{' '}
            <Link href="/hunter" className="text-amber-700 hover:underline font-medium">
              Hunter dashboard
            </Link>{' '}
            to run scans.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 disabled:opacity-50 shrink-0"
        >
          {saving ? 'Saving…' : 'Save all hunter settings'}
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={mh.enabled}
          onChange={(e) => setMh({ ...mh, enabled: e.target.checked })}
          className="rounded border-slate-300"
        />
        <span className="text-slate-800 font-medium">Enable Market Hunter</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <label className="block">
          <span className="text-slate-700 font-medium">Max spend per scan (USD)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={mh.maxSpendPerRunUsd}
            onChange={(e) =>
              setMh({ ...mh, maxSpendPerRunUsd: parseFloat(e.target.value) || 0.5 })
            }
          />
        </label>
        <label className="block">
          <span className="text-slate-700 font-medium">Listings per category</span>
          <input
            type="number"
            min="1"
            max="50"
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={mh.defaultListingLimit}
            onChange={(e) =>
              setMh({ ...mh, defaultListingLimit: parseInt(e.target.value, 10) || 20 })
            }
          />
        </label>
        <label className="block sm:col-span-1">
          <span className="text-slate-700 font-medium">Action card payment path</span>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            value={mh.paymentPath}
            onChange={(e) => setMh({ ...mh, paymentPath: e.target.value })}
          />
        </label>
      </div>

      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-4">
        <legend className="text-sm font-semibold text-slate-900 px-1">LLM providers & models</legend>
        <p className="text-xs text-slate-500 -mt-2">
          OpenRouter is recommended — one key routes to many models. Direct providers use native APIs
          (xAI web search for research, Anthropic for complaints).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 rounded-md bg-slate-50 p-3 border border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Marketplace research
            </p>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Provider</span>
              <select
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                value={mh.llm.researchProvider}
                onChange={(e) =>
                  setMh({
                    ...mh,
                    llm: {
                      ...mh.llm,
                      researchProvider: e.target.value as 'openrouter' | 'xai',
                    },
                  })
                }
              >
                <option value="openrouter">OpenRouter (recommended)</option>
                <option value="xai">xAI Grok (direct)</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Model</span>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-xs"
                value={mh.llm.researchModel}
                onChange={(e) =>
                  setMh({ ...mh, llm: { ...mh.llm, researchModel: e.target.value } })
                }
                placeholder={RESEARCH_MODEL_HINTS[mh.llm.researchProvider]}
              />
              <p className="text-xs text-slate-500 mt-1">
                {RESEARCH_MODEL_HINTS[mh.llm.researchProvider]}
              </p>
            </label>
          </div>

          <div className="space-y-3 rounded-md bg-slate-50 p-3 border border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Complaint extraction
            </p>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Provider</span>
              <select
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 bg-white"
                value={mh.llm.complaintsProvider}
                onChange={(e) =>
                  setMh({
                    ...mh,
                    llm: {
                      ...mh.llm,
                      complaintsProvider: e.target.value as 'openrouter' | 'anthropic',
                    },
                  })
                }
              >
                <option value="openrouter">OpenRouter (recommended)</option>
                <option value="anthropic">Anthropic (direct)</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-slate-700 font-medium">Model</span>
              <input
                className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-xs"
                value={mh.llm.complaintsModel}
                onChange={(e) =>
                  setMh({ ...mh, llm: { ...mh.llm, complaintsModel: e.target.value } })
                }
                placeholder={COMPLAINTS_MODEL_HINTS[mh.llm.complaintsProvider]}
              />
              <p className="text-xs text-slate-500 mt-1">
                {COMPLAINTS_MODEL_HINTS[mh.llm.complaintsProvider]}
              </p>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-sm font-semibold text-slate-900 px-1">API keys</legend>
        <p className="text-xs text-slate-500 -mt-2">
          Leave blank to keep existing values. Only keys required for your selected providers need to
          be set.
        </p>
        {credentials.map((c) => (
          <label key={c.key} className="block text-sm">
            <span className="text-slate-700 font-medium">{c.label}</span>
            <span className="ml-2 text-xs text-slate-500">
              {c.configured
                ? c.source === 'env'
                  ? `(active via ${c.envVar})`
                  : '(stored)'
                : '(not configured)'}
            </span>
            <input
              type="password"
              autoComplete="off"
              placeholder={c.hasStoredValue ? '••••••••  (leave blank to keep)' : `Enter ${c.envVar}`}
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-sm"
              value={credentialValues[c.key] ?? ''}
              onChange={(e) =>
                setCredentialValues({ ...credentialValues, [c.key]: e.target.value })
              }
            />
          </label>
        ))}
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-3">
        <legend className="text-sm font-semibold text-slate-900 px-1">
          Budget estimates (USD per API call)
        </legend>
        <p className="text-xs text-slate-500 -mt-2">
          Used for spend guard pre-checks. Tune from your actual OpenRouter or provider billing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <label className="block">
            <span className="text-slate-700 font-medium">Listing research</span>
            <input
              type="number"
              step="0.0001"
              min="0"
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
              value={mh.costEstimates.researchListingCallUsd}
              onChange={(e) =>
                setMh({
                  ...mh,
                  costEstimates: {
                    ...mh.costEstimates,
                    researchListingCallUsd: parseFloat(e.target.value) || 0.002,
                  },
                })
              }
            />
          </label>
          <label className="block">
            <span className="text-slate-700 font-medium">Review fetch</span>
            <input
              type="number"
              step="0.0001"
              min="0"
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
              value={mh.costEstimates.researchReviewsCallUsd}
              onChange={(e) =>
                setMh({
                  ...mh,
                  costEstimates: {
                    ...mh.costEstimates,
                    researchReviewsCallUsd: parseFloat(e.target.value) || 0.001,
                  },
                })
              }
            />
          </label>
          <label className="block">
            <span className="text-slate-700 font-medium">Complaint analysis</span>
            <input
              type="number"
              step="0.0001"
              min="0"
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
              value={mh.costEstimates.complaintAnalysisCallUsd}
              onChange={(e) =>
                setMh({
                  ...mh,
                  costEstimates: {
                    ...mh.costEstimates,
                    complaintAnalysisCallUsd: parseFloat(e.target.value) || 0.003,
                  },
                })
              }
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-slate-800 mb-2">Platforms</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {PLATFORM_KEYS.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={mh.platforms[key]}
                onChange={(e) =>
                  setMh({
                    ...mh,
                    platforms: { ...mh.platforms, [key]: e.target.checked },
                  })
                }
                className="rounded border-slate-300"
              />
              {PLATFORM_LABELS[key]}
            </label>
          ))}
        </div>

        <p className="text-xs text-slate-500 mb-3">
          Categories to scan per platform (one per line). Reset restores built-in defaults.
        </p>
        <div className="space-y-3">
          {PLATFORM_KEYS.filter((key) => mh.platforms[key]).map((key) => (
            <div key={key} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-slate-800">{PLATFORM_LABELS[key]}</span>
                <button
                  type="button"
                  onClick={() => resetCategories(key)}
                  className="text-xs text-amber-700 hover:underline"
                >
                  Reset defaults
                </button>
              </div>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-xs"
                value={categoryText[key] ?? ''}
                onChange={(e) =>
                  setCategoryText((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4 space-y-2">
        <legend className="text-sm font-semibold text-slate-900 px-1">Scheduled scans</legend>
        <label className="block text-sm">
          <span className="text-slate-700 font-medium">Cron expression</span>
          <input
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 font-mono text-xs"
            value={mh.scheduleCron}
            onChange={(e) => setMh({ ...mh, scheduleCron: e.target.value })}
          />
        </label>
        <div className="rounded-md bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1">
          <p>
            Point your scheduler (cron, GitHub Actions, Vercel Cron) at:
          </p>
          <code className="block bg-white border border-slate-200 rounded px-2 py-1 font-mono break-all">
            POST {scheduleEndpoint}
          </code>
          <p>
            Header: <code className="bg-white px-1 rounded">Authorization: Bearer &lt;CRON_SECRET&gt;</code>
          </p>
          <p className="text-slate-500">
            Current expression <code className="bg-white px-1 rounded">{mh.scheduleCron}</code> is
            stored for reference — wire it in your external scheduler.
          </p>
        </div>
      </fieldset>

      {message && (
        <p className={`text-sm ${message.includes('saved') ? 'text-emerald-700' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </section>
  );
}
