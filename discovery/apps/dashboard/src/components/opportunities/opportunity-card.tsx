'use client';

import type { OpportunityType } from '@agency/scoring';
import { BoiBriefExpand } from '@/components/intelligence/boi-brief-expand';
import { OpportunityBriefExpand } from '@/components/opportunities/opportunity-brief-expand';

type Reachability = 'high' | 'medium' | 'low' | 'none';

type FactorChip = {
  key: string;
  label: string;
  value: number;
};

export type OpportunityCardItem = {
  business: {
    id: string;
    name: string;
    city: string | null;
    website: string | null;
    email?: string | null;
    phone?: string | null;
  };
  account: { id: string };
  run: { id: string; industry: string; city: string };
  score: number;
  reachability: Reachability;
  verified: boolean;
  listSuppressed?: boolean;
  demandSignalCount: number;
  enrichmentSignalCount: number;
  opportunityType: OpportunityType;
  opportunityTypeLabel: string;
  pitchAngle: string;
  positiveFactors: FactorChip[];
  blockers: FactorChip[];
  footprintChips?: string[];
};

const REACHABILITY_STYLES: Record<Reachability, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-amber-100 text-amber-900',
  none: 'bg-red-100 text-red-800',
};

const TYPE_STYLES: Record<OpportunityType, string> = {
  demand_response: 'bg-amber-100 text-amber-950 border-amber-200',
  greenfield: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  redesign: 'bg-violet-100 text-violet-900 border-violet-200',
  modernize: 'bg-sky-100 text-sky-900 border-sky-200',
  general: 'bg-slate-100 text-slate-800 border-slate-200',
};

type OpportunityCardProps = {
  item: OpportunityCardItem;
  tierLabel?: string;
  priority?: number;
  promoteBlocked?: string;
  promoteAllowed: boolean;
  loading: boolean;
  onStartPursuit: () => void;
  onDismiss: () => void;
  onReject: () => void;
};

export function OpportunityCard({
  item,
  tierLabel,
  priority,
  promoteBlocked,
  promoteAllowed,
  loading,
  onStartPursuit,
  onDismiss,
  onReject,
}: OpportunityCardProps) {
  const contactParts: string[] = [];
  if (item.business.email) contactParts.push(item.business.email);
  else if (item.business.phone) contactParts.push(item.business.phone);

  return (
    <article className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 min-w-0 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{item.business.name}</h3>
            {tierLabel && (
              <span className="text-xs font-medium px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-200">
                {tierLabel}
              </span>
            )}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${TYPE_STYLES[item.opportunityType]}`}
            >
              {item.opportunityTypeLabel}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${
                item.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-900'
              }`}
            >
              {item.verified ? 'Verified' : 'Unverified'}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded ${REACHABILITY_STYLES[item.reachability]}`}
            >
              {item.reachability} reachability
            </span>
            {item.listSuppressed && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                Suppression list
              </span>
            )}
          </div>

          <p className="text-sm text-slate-600">
            {item.run.industry} · {item.business.city || item.run.city}
            {item.business.website ? (
              <>
                {' · '}
                <a
                  href={item.business.website.startsWith('http') ? item.business.website : `https://${item.business.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline"
                >
                  {item.business.website.replace(/^https?:\/\//, '')}
                </a>
              </>
            ) : (
              ' · No website'
            )}
            {contactParts.length > 0 && ` · ${contactParts.join(' · ')}`}
          </p>

          <div className="rounded-md border border-brand-100 bg-brand-50/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-800 mb-0.5">
              Pitch angle
            </p>
            <p className="text-sm text-brand-950 leading-snug">{item.pitchAngle}</p>
          </div>

          {(item.demandSignalCount > 0 || item.enrichmentSignalCount > 0) && (
            <div className="flex flex-wrap gap-2">
              {item.demandSignalCount > 0 && (
                <span className="text-xs font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  {item.demandSignalCount} demand signal{item.demandSignalCount === 1 ? '' : 's'}
                </span>
              )}
              {item.enrichmentSignalCount > 0 && (
                <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {item.enrichmentSignalCount} enrichment
                </span>
              )}
            </div>
          )}

          {(item.footprintChips?.length ?? 0) > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Digital footprint
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.footprintChips!.map((chip) => (
                  <span
                    key={chip}
                    className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-100"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.positiveFactors.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Why this opportunity
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.positiveFactors.map((factor) => (
                  <span
                    key={factor.key}
                    className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800"
                    title={`+${factor.value} score`}
                  >
                    {factor.label}
                    <span className="text-slate-500 ml-1">+{factor.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.blockers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.blockers.map((factor) => (
                <span
                  key={factor.key}
                  className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-100"
                >
                  {factor.label}
                </span>
              ))}
            </div>
          )}

          {!promoteAllowed && promoteBlocked && (
            <p className="text-xs text-amber-800">{promoteBlocked}</p>
          )}

          <BoiBriefExpand businessId={item.business.id} compact />
          <OpportunityBriefExpand businessId={item.business.id} />
        </div>

        <div className="flex lg:flex-col items-center justify-center gap-2 p-4 lg:w-44 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50/50">
          <div className="text-center lg:mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {priority != null ? 'Priority' : 'Score'}
            </p>
            <p className="text-3xl font-bold text-brand-600 tabular-nums">
              {priority ?? item.score}
            </p>
            {priority != null && (
              <p className="text-[10px] text-slate-500 mt-0.5">score {item.score}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onStartPursuit}
            disabled={loading || !promoteAllowed}
            title={promoteAllowed ? undefined : promoteBlocked}
            className="w-full bg-brand-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Start pursuit
          </button>
          <button
            type="button"
            onClick={onDismiss}
            disabled={loading}
            className="w-full border border-slate-300 px-3 py-2 rounded-md text-sm hover:bg-white disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={loading}
            className="w-full text-red-600 border border-red-200 px-3 py-2 rounded-md text-sm hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </article>
  );
}
