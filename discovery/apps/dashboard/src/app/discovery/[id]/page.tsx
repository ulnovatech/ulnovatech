'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { isAllCities } from '@agency/geo';
import type { DiscoveryRunStats } from '@agency/discovery';
import { BoiBriefExpand } from '@/components/intelligence/boi-brief-expand';
import { BoiBriefSummaryChip } from '@/components/intelligence/boi-brief-summary-chip';
import { RunProgress } from '@/components/discovery/run-progress';
import { RunYieldPanel } from '@/components/discovery/run-yield-panel';
import { BOI_COPY } from '@/lib/product-copy';
import { api } from '@/lib/api';

type Signal = {
  id: string;
  signalType: string;
  signalClass?: string;
  signalStrength: number;
  source: string;
  title: string | null;
  snippet: string | null;
  sourceUrl: string | null;
};

type Business = {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  source: string;
  sourceUrl: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  score: number | null;
  signals: Signal[];
  analysis: { hasWebsite: boolean; httpsEnabled: boolean | null; mobileFriendly: boolean | null } | null;
};

function formatSource(source: string) {
  const labels: Record<string, string> = {
    google_maps: 'Google Maps',
    facebook: 'Facebook',
    instagram: 'Instagram',
    csv_import: 'CSV Import',
  };
  return labels[source] ?? source;
}

function formatLocation(city: string | null, country: string | null) {
  if (!city || isAllCities(city)) return country ?? '—';
  return `${city}, ${country}`;
}

export default function DiscoveryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [run, setRun] = useState<{
    city: string;
    country: string;
    industry: string;
    status: string;
    runProfile?: string;
    prospectFocus?: boolean;
    errorMessage?: string | null;
    stats?: DiscoveryRunStats | null;
  } | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [expandedBoiId, setExpandedBoiId] = useState<string | null>(null);

  const pipelineRunning = run?.status === 'pending' || run?.status === 'running';

  const load = () =>
    api<{ run: typeof run; businesses: Business[] }>(`/api/discovery/runs/${id}`).then((d) => {
      setRun(d.run);
      setBusinesses(d.businesses);
    });

  useEffect(() => {
    load().catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!run || (run.status !== 'pending' && run.status !== 'running')) return;
    const timer = setInterval(() => load().catch(console.error), 3000);
    return () => clearInterval(timer);
  }, [run?.status, id]);

  const retryFromFailedStage = async () => {
    setRetrying(true);
    setRetryError(null);
    try {
      await api(`/api/discovery/runs/${id}/retry`, { method: 'POST' });
      await load();
    } catch (e) {
      setRetryError(e instanceof Error ? e.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="max-w-[1200px]">
      <h2 className="text-2xl font-semibold mb-2">
        {run ? `${run.industry} — ${run.city}, ${run.country}` : 'Discovery Run'}
      </h2>
      <p className="text-slate-600 mb-2">
        Status: {run?.status}
        {run?.runProfile && (
          <span className="ml-3 text-slate-500">Profile: {run.runProfile}</span>
        )}
        {run?.prospectFocus && (
          <span className="ml-3 inline-block px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800">
            Prospect focus
          </span>
        )}
      </p>
      {run && <RunProgress runId={id} runStatus={run.status} detailed />}

      {run?.stats && <RunYieldPanel stats={run.stats} />}

      {run?.status === 'failed' && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-medium text-red-900">Pipeline failed</p>
          {run.errorMessage && (
            <p className="text-red-800 mt-1">{run.errorMessage}</p>
          )}
          {retryError && <p className="text-red-700 mt-2 text-xs">{retryError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={retryFromFailedStage}
              disabled={retrying}
              className="bg-red-700 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-800 disabled:opacity-50"
            >
              {retrying ? 'Retrying…' : 'Retry from failed stage'}
            </button>
            <Link
              href="/discovery"
              className="border border-red-300 text-red-800 px-3 py-1.5 rounded-md text-sm hover:bg-red-100"
            >
              Start new run
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[1020px]">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Contact</th>
              <th className="p-3">City</th>
              <th className="p-3">Source</th>
              <th className="p-3">Website</th>
              <th className="p-3">Reviews</th>
              <th className="p-3">Score</th>
              <th className="p-3">{BOI_COPY.opportunityBrief}</th>
              <th className="p-3">Intent signals</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((b) => (
              <Fragment key={b.id}>
                <tr key={b.id} className="border-t align-top">
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-slate-600">
                    {b.phone && <div>{b.phone}</div>}
                    {b.email && <div className="text-xs">{b.email}</div>}
                    {!b.phone && !b.email && '—'}
                  </td>
                  <td className="p-3">{formatLocation(b.city, b.country)}</td>
                  <td className="p-3">
                    <span className="text-xs font-medium text-slate-700">
                      {formatSource(b.source)}
                    </span>
                    {(b.googleMapsUrl || b.sourceUrl) && (
                      <a
                        href={b.googleMapsUrl ?? b.sourceUrl ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-xs text-brand-600 hover:underline mt-1"
                      >
                        View source
                      </a>
                    )}
                  </td>
                  <td className="p-3">
                    {b.website ? (
                      <a
                        href={b.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-600 hover:underline break-all"
                      >
                        {b.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-amber-600 font-medium">None</span>
                    )}
                  </td>
                  <td className="p-3">
                    {b.rating != null ? (
                      <span>
                        {b.rating} ★ ({b.reviewCount ?? 0})
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">
                    {b.score != null ? (
                      <span className="font-bold text-brand-600">{b.score}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3">
                    <BoiBriefSummaryChip
                      businessId={b.id}
                      onOpen={() => setExpandedBoiId(expandedBoiId === b.id ? null : b.id)}
                    />
                  </td>
                  <td className="p-3">
                    <div className="space-y-1 max-w-xs">
                      {b.signals?.map((s) => (
                        <div
                          key={s.id}
                          className={`text-xs px-2 py-1 rounded border ${
                            s.signalClass === 'demand'
                              ? 'bg-amber-50 text-amber-900 border-amber-100'
                              : 'bg-purple-50 text-purple-900 border-purple-100'
                          }`}
                        >
                          <strong>{s.title ?? s.signalType}</strong> ({s.signalStrength})
                          <span className="ml-1 opacity-75">
                            · {s.signalClass === 'demand' ? 'demand' : 'enrichment'}
                          </span>
                          {s.snippet && (
                            <p className="text-purple-700 mt-0.5 font-normal">{s.snippet}</p>
                          )}
                        </div>
                      ))}
                      {(!b.signals || b.signals.length === 0) && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedBoiId === b.id && (
                  <tr className="border-t bg-violet-50/30">
                    <td colSpan={9} className="p-4">
                      <BoiBriefExpand
                        businessId={b.id}
                        pipelineRunning={pipelineRunning}
                        defaultOpen
                        embedded
                        onClose={() => setExpandedBoiId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <p className="p-6 text-center text-slate-500">No businesses in this run.</p>
        )}
      </div>
    </div>
  );
}
