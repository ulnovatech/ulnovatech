'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RunTerminal } from '@/components/discovery/run-terminal';
import { CsvImportPanel } from '@/components/discovery/csv-import-panel';
import { PageHeader } from '@/components/layout/page-header';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { api } from '@/lib/api';
import { PAGE_COPY } from '@/lib/product-copy';

type Run = {
  id: string;
  country: string;
  city: string;
  industry: string;
  status: string;
  runProfile?: string;
  prospectFocus?: boolean;
  boiNarrative?: boolean;
  startedAt: string | null;
  completedAt: string | null;
  stats?: {
    contactablePct?: number | null;
    accountsSaved?: number;
    candidatesDiscovered?: number;
    prospectCandidates?: number;
    highPotentialEstimate?: number;
  } | null;
};

type RunProfile = 'micro' | 'standard' | 'boost';

type DiscoveryOptions = {
  countries: string[];
  industries: string[];
  citiesByCountry: Record<string, string[]>;
  allCitiesLabel: string;
  defaults: { country: string; city: string; industry: string };
};

type BudgetProvider = {
  provider: string;
  cap: number;
  used: number;
  remaining: number;
  canSpend: boolean;
};

type SourceStatus = {
  name: string;
  label: string;
  configured: boolean;
  enabled?: boolean;
  reason?: string;
  health?: string;
};

function formatLocation(city: string, country: string, allCitiesLabel: string) {
  if (city.trim().toLowerCase() === allCitiesLabel.trim().toLowerCase()) {
    return `All cities · ${country}`;
  }
  return `${city}, ${country}`;
}

export default function DiscoveryPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading discovery…</p>}>
      <DiscoveryPageContent />
    </Suspense>
  );
}

function DiscoveryPageContent() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status');
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [sourcesReady, setSourcesReady] = useState(false);
  const [options, setOptions] = useState<DiscoveryOptions | null>(null);
  const [budgetInfo, setBudgetInfo] = useState<{
    acquisitionMode: string;
    searchQueriesPerRun?: number;
    providers: BudgetProvider[];
  } | null>(null);
  const [form, setForm] = useState<{
    country: string;
    city: string;
    industry: string;
    profile: RunProfile;
    prospectFocus: boolean;
    boiNarrative: boolean;
  }>({
    country: '',
    city: '',
    industry: '',
    profile: 'standard',
    prospectFocus: false,
    boiNarrative: false,
  });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [wiping, setWiping] = useState(false);

  const allCitiesLabel = options?.allCitiesLabel ?? 'All cities';

  const cityOptions = useMemo(() => {
    if (!options) return [];
    const specific = options.citiesByCountry[form.country] ?? [];
    return [options.allCitiesLabel, ...specific];
  }, [options, form.country]);

  const load = () => api<{ runs: Run[] }>('/api/discovery/runs').then((d) => setRuns(d.runs));

  const loadSources = () =>
    api<{
      sources: SourceStatus[];
      ready: boolean;
      message?: string;
      budget?: { acquisitionMode: string; searchQueriesPerRun?: number; providers: BudgetProvider[] };
    }>('/api/discovery/sources').then((d) => {
      setSources(d.sources);
      setSourcesReady(d.ready);
      if (d.budget) setBudgetInfo(d.budget);
      if (!d.ready && d.message) setError(d.message);
    });

  useEffect(() => {
    const hasActive = runs.some((r) => r.status === 'pending' || r.status === 'running');
    if (!hasActive) return;
    const id = setInterval(() => load().catch(console.error), 3000);
    return () => clearInterval(id);
  }, [runs]);

  useEffect(() => {
    load().catch(console.error);

    api<DiscoveryOptions>('/api/discovery/options')
      .then((opts) => {
        setOptions(opts);
        setForm((prev) => ({
          ...prev,
          country: opts.defaults.country,
          city: opts.defaults.city,
          industry: opts.defaults.industry,
        }));
      })
      .catch(console.error);

    loadSources().catch(console.error);
  }, []);

  const setCountry = (country: string) => {
    const allLabel = options?.allCitiesLabel ?? 'All cities';
    setForm({ ...form, country, city: allLabel });
  };

  const wipeRuns = async () => {
    if (
      !window.confirm(
        'Delete ALL discovery runs, businesses, and pipeline jobs? This cannot be undone.',
      )
    ) {
      return;
    }
    setWiping(true);
    setError(null);
    try {
      const result = await api<{ message: string }>('/api/discovery/runs/wipe', { method: 'DELETE' });
      setActiveRunId(null);
      setRuns([]);
      await load();
      setError(null);
      window.alert(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wipe failed');
    } finally {
      setWiping(false);
    }
  };

  const startRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.country || !form.city || !form.industry) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api<{ run: { id: string } }>('/api/discovery/runs', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setActiveRunId(result.run.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Discovery failed');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    Boolean(form.country && form.city && form.industry && sourcesReady && options);

  const displayedRuns = statusFilter
    ? runs.filter((r) => r.status === statusFilter)
    : runs;

  return (
    <div className="max-w-5xl">
      <PageHeader title={PAGE_COPY.discovery.title} description={PAGE_COPY.discovery.description} />
      <p className="text-slate-600 mb-4 text-sm -mt-2">
        Places verifies/enriches gaps in standard/boost mode. City defaults to{' '}
        <strong>{allCitiesLabel}</strong> for country-wide search. Edit options in{' '}
        <Link href="/settings" className="text-brand-600 hover:underline">
          Settings
        </Link>
        .
      </p>

      <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
        <p className="font-medium text-slate-700 mb-2">
          Discovery sources
          {budgetInfo && (
            <span className="ml-2 font-normal text-slate-500">
              · mode: <strong>{budgetInfo.acquisitionMode}</strong>
              {budgetInfo.searchQueriesPerRun != null &&
                ` · up to ${budgetInfo.searchQueriesPerRun} search queries/run`}
            </span>
          )}
        </p>
        <ul className="space-y-1">
          {sources.map((s) => (
            <li key={s.name} className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  s.health === 'degraded'
                    ? 'bg-red-500'
                    : s.configured && s.enabled !== false
                      ? 'bg-green-500'
                      : s.configured
                        ? 'bg-amber-400'
                        : 'bg-slate-300'
                }`}
              />
              {s.label}
              <span className="text-slate-500">
                {!s.configured
                  ? 'not configured'
                  : s.health === 'degraded'
                    ? 'degraded'
                    : s.enabled === false
                      ? 'configured, disabled'
                      : 'ready'}
              </span>
              {s.reason && (
                <span
                  className={`text-xs ${s.health === 'degraded' ? 'text-red-700' : 'text-amber-700'}`}
                >
                  ({s.reason})
                </span>
              )}
            </li>
          ))}
        </ul>
        {budgetInfo && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
            {budgetInfo.providers
              .filter((p) => ['google_cse', 'bing_search', 'google_places', 'meta_graph'].includes(p.provider))
              .map((p) => (
                <div key={p.provider}>
                  <span className="font-medium">{p.provider.replace(/_/g, ' ')}</span>: {p.remaining}/
                  {p.cap} left
                </div>
              ))}
          </div>
        )}
        {!sourcesReady && (
          <p className="mt-2 text-amber-700">
            Configure at least one source in{' '}
            <Link href="/settings" className="text-brand-600 hover:underline">
              Settings
            </Link>
            .
          </p>
        )}
      </div>

      <CsvImportPanel onUploaded={() => loadSources().catch(console.error)} />

      {error && (
        <p className="mb-4 text-red-700 text-sm bg-red-50 border border-red-200 rounded p-3">{error}</p>
      )}

      <form
        onSubmit={startRun}
        className="relative z-10 bg-white border border-slate-200 rounded-lg p-4 mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-visible"
      >
        <SearchableSelect
          label="Country"
          value={form.country}
          options={options?.countries ?? []}
          onChange={setCountry}
          placeholder="Search countries…"
        />
        <SearchableSelect
          label="City"
          value={form.city}
          options={cityOptions}
          onChange={(city) => setForm({ ...form, city })}
          placeholder="Search cities…"
        />
        <SearchableSelect
          label="Industry"
          value={form.industry}
          options={options?.industries ?? []}
          onChange={(industry) => setForm({ ...form, industry })}
          placeholder="Search industries…"
        />
        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="sm:col-span-3 bg-brand-600 text-white rounded-md py-2 font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Queuing…' : 'Run Discovery'}
        </button>
        <RunTerminal
          runId={activeRunId}
          runStatus={runs.find((r) => r.id === activeRunId)?.status ?? (loading ? 'pending' : undefined)}
        />
        <div className="sm:col-span-3 flex justify-end">
          <button
            type="button"
            onClick={wipeRuns}
            disabled={wiping || runs.length === 0}
            className="text-xs text-red-700 border border-red-200 bg-red-50 rounded px-3 py-1.5 hover:bg-red-100 disabled:opacity-40"
          >
            {wiping ? 'Wiping…' : 'Wipe all runs'}
          </button>
        </div>
        <label className="sm:col-span-3 block text-sm">
          <span className="text-slate-700 font-medium">Run profile</span>
          <select
            className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2"
            value={form.profile}
            onChange={(e) => setForm({ ...form, profile: e.target.value as RunProfile })}
          >
            <option value="micro">Micro — search/CSV only, 0 Places</option>
            <option value="standard">Standard — verify gaps (≤20 Places/run)</option>
            <option value="boost">Boost — higher verify + enrich caps</option>
          </select>
        </label>
        <label className="sm:col-span-3 flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50/60 p-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={form.prospectFocus}
            onChange={(e) => setForm({ ...form, prospectFocus: e.target.checked })}
          />
          <span className="text-sm">
            <span className="font-medium text-slate-900">Prospect focus</span>
            <span className="block text-slate-600 mt-0.5">
              Bias search toward Facebook-only and &quot;no website&quot; angles. High-potential
              candidates are verified first in standard/boost mode.
            </span>
          </span>
        </label>
        <label className="sm:col-span-3 flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/50 p-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            checked={form.boiNarrative}
            onChange={(e) => setForm({ ...form, boiNarrative: e.target.checked })}
          />
          <span className="text-sm">
            <span className="font-medium text-slate-900">AI opportunity narrative</span>
            <span className="block text-slate-600 mt-0.5">
              Generate an evidence-grounded executive summary with OpenAI when configured in
              Settings. Rules-based briefs are always produced as fallback.
            </span>
          </span>
        </label>
      </form>

      {statusFilter && (
        <div className="mb-4 flex items-center gap-3 text-sm">
          <span className="text-slate-600">
            Showing <strong>{statusFilter}</strong> runs ({displayedRuns.length})
          </span>
          <Link href="/discovery" className="text-brand-700 hover:underline">
            Clear filter
          </Link>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Location</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Profile</th>
              <th className="p-3">Focus</th>
              <th className="p-3">Status</th>
              <th className="p-3">Yield</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {displayedRuns.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{formatLocation(r.city, r.country, allCitiesLabel)}</td>
                <td className="p-3">{r.industry}</td>
                <td className="p-3 text-xs text-slate-600">{r.runProfile ?? 'standard'}</td>
                <td className="p-3 text-xs">
                  {r.prospectFocus ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium">
                      Prospect
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-slate-600">
                  {r.stats?.accountsSaved != null ? (
                    <>
                      <span className="font-medium text-slate-800">{r.stats.accountsSaved}</span> saved
                      {r.stats.contactablePct != null && (
                        <span className="block text-slate-500">
                          {r.stats.contactablePct}% contactable
                        </span>
                      )}
                      {r.stats.prospectCandidates != null && r.stats.prospectCandidates > 0 && (
                        <span className="block text-brand-700">
                          {r.stats.prospectCandidates} prospect
                          {r.stats.highPotentialEstimate != null &&
                            ` · ${r.stats.highPotentialEstimate} high-potential`}
                        </span>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="p-3 text-right">
                  <Link href={`/discovery/${r.id}`} className="text-brand-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {displayedRuns.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  {statusFilter
                    ? `No ${statusFilter} runs.`
                    : 'No runs yet. Start your first discovery above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
