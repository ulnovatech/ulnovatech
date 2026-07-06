'use client';

import type { OpportunityType } from '@agency/scoring';

export type WebsiteOpportunityBrief = {
  opportunityType: OpportunityType;
  opportunityTypeLabel: string;
  pitchAngle: string;
  outreachHook: string;
  positiveFactors: Array<{ key: string; label: string; value: number }>;
  blockers: Array<{ key: string; label: string; value: number }>;
  websiteGaps: Array<{ key: string; label: string; severity: 'high' | 'medium' | 'info' }>;
  crawlStatus: string | null;
  crawlStatusLabel: string | null;
  website: string | null;
  analysis: {
    hasWebsite: boolean;
    httpsEnabled: boolean | null;
    mobileFriendly: boolean | null;
    notes: string | null;
    analyzedAt?: string | null;
  } | null;
  score: number | null;
  reachability: string | null;
  demandSnippets: Array<{
    id: string;
    title: string | null;
    snippet: string | null;
    signalStrength: number;
    source: string;
  }>;
  footprintChips?: string[];
  infrastructureGaps?: Array<{ key: string; label: string; severity: 'high' | 'medium' | 'info' }>;
};

const TYPE_STYLES: Record<OpportunityType, string> = {
  demand_response: 'bg-amber-100 text-amber-950 border-amber-200',
  greenfield: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  redesign: 'bg-violet-100 text-violet-900 border-violet-200',
  modernize: 'bg-sky-100 text-sky-900 border-sky-200',
  general: 'bg-slate-100 text-slate-800 border-slate-200',
};

const GAP_STYLES = {
  high: 'bg-red-50 text-red-900 border-red-100',
  medium: 'bg-amber-50 text-amber-900 border-amber-100',
  info: 'bg-slate-50 text-slate-700 border-slate-100',
};

type OpportunityBriefPanelProps = {
  brief: WebsiteOpportunityBrief;
  compact?: boolean;
};

export function OpportunityBriefPanel({ brief, compact = false }: OpportunityBriefPanelProps) {
  const websiteUrl = brief.website
    ? brief.website.startsWith('http')
      ? brief.website
      : `https://${brief.website}`
    : null;

  return (
    <section className="bg-white border border-brand-200 rounded-lg overflow-hidden">
      <div className="bg-brand-50/60 px-4 py-3 border-b border-brand-100">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">Website opportunity brief</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded border ${TYPE_STYLES[brief.opportunityType]}`}
          >
            {brief.opportunityTypeLabel}
          </span>
          {brief.score != null && (
            <span className="text-xs text-slate-600">
              Score {brief.score}
              {brief.reachability && ` · ${brief.reachability} reachability`}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-md border border-brand-100 bg-brand-50/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-800 mb-0.5">
            Outreach hook
          </p>
          <p className="text-sm text-brand-950 leading-snug">{brief.outreachHook}</p>
        </div>

        {!compact && (brief.footprintChips?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Digital footprint
            </p>
            <div className="flex flex-wrap gap-1.5">
              {brief.footprintChips!.map((chip) => (
                <span
                  key={chip}
                  className="text-xs px-2 py-1 rounded border bg-indigo-50 text-indigo-900 border-indigo-100"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
        )}

        {!compact && (brief.infrastructureGaps?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Infrastructure gaps
            </p>
            <div className="flex flex-wrap gap-1.5">
              {brief.infrastructureGaps!.map((gap) => (
                <span
                  key={gap.key}
                  className={`text-xs px-2 py-1 rounded border ${GAP_STYLES[gap.severity]}`}
                >
                  {gap.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {!compact && brief.websiteGaps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Website gaps
            </p>
            <div className="flex flex-wrap gap-1.5">
              {brief.websiteGaps.map((gap) => (
                <span
                  key={gap.key}
                  className={`text-xs px-2 py-1 rounded border ${GAP_STYLES[gap.severity]}`}
                >
                  {gap.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {!compact && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-50 rounded px-2 py-1.5">
              <p className="text-slate-500">Website</p>
              <p className="font-medium text-slate-800">
                {brief.analysis?.hasWebsite ?? !!brief.website ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="bg-slate-50 rounded px-2 py-1.5">
              <p className="text-slate-500">HTTPS</p>
              <p className="font-medium text-slate-800">
                {brief.analysis?.httpsEnabled === null
                  ? '—'
                  : brief.analysis?.httpsEnabled
                    ? 'Yes'
                    : 'No'}
              </p>
            </div>
            <div className="bg-slate-50 rounded px-2 py-1.5">
              <p className="text-slate-500">Mobile</p>
              <p className="font-medium text-slate-800">
                {brief.analysis?.mobileFriendly === null
                  ? '—'
                  : brief.analysis?.mobileFriendly
                    ? 'Yes'
                    : 'No'}
              </p>
            </div>
            <div className="bg-slate-50 rounded px-2 py-1.5">
              <p className="text-slate-500">Crawl</p>
              <p className="font-medium text-slate-800 truncate" title={brief.crawlStatusLabel ?? ''}>
                {brief.crawlStatus ?? '—'}
              </p>
            </div>
          </div>
        )}

        {websiteUrl && (
          <p className="text-xs">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 hover:underline break-all"
            >
              {brief.website}
            </a>
          </p>
        )}

        {!compact && brief.crawlStatusLabel && brief.crawlStatus !== 'ok' && (
          <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded px-2 py-1.5">
            {brief.crawlStatusLabel}
          </p>
        )}

        {!compact && brief.analysis?.notes && (
          <p className="text-xs text-slate-600 italic">{brief.analysis.notes}</p>
        )}

        {!compact && brief.demandSnippets.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Demand signals
            </p>
            <div className="space-y-2">
              {brief.demandSnippets.map((s) => (
                <div
                  key={s.id}
                  className="text-sm bg-amber-50 border border-amber-100 rounded px-3 py-2"
                >
                  <p className="font-medium text-amber-950">
                    {s.title ?? 'Demand signal'}{' '}
                    <span className="font-normal text-amber-800/80">
                      · {s.source} · {s.signalStrength}
                    </span>
                  </p>
                  {s.snippet && (
                    <p className="text-amber-900/90 mt-0.5 text-xs leading-snug">{s.snippet}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!compact && brief.positiveFactors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {brief.positiveFactors.map((f) => (
              <span key={f.key} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {f.label} +{f.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
