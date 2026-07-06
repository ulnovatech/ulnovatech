'use client';

export type DemandWorkItem = {
  id: string;
  source: string;
  signalType: string;
  signalStrength: number;
  title: string | null;
  snippet: string | null;
  sourceUrl: string | null;
  capturedAt: string;
};

export type DemandProspectDraft = {
  name: string;
  city: string;
  country: string;
  industry: string;
  businessId: string;
};

export function defaultDemandDraft(signal: DemandWorkItem): DemandProspectDraft {
  const title = signal.title?.replace(/^\[[^\]]+\]\s*/, '').trim() ?? '';
  return {
    name: title.slice(0, 200),
    city: '',
    country: '',
    industry: '',
    businessId: '',
  };
}

type DemandWorkCardProps = {
  item: DemandWorkItem;
  tierLabel: string;
  priority: number;
  draft: DemandProspectDraft;
  loading: boolean;
  onDraftChange: (draft: DemandProspectDraft) => void;
  onCreateProspect: () => void;
  onMatch: () => void;
  onDismiss: () => void;
};

export function DemandWorkCard({
  item,
  tierLabel,
  priority,
  draft,
  loading,
  onDraftChange,
  onCreateProspect,
  onMatch,
  onDismiss,
}: DemandWorkCardProps) {
  return (
    <article className="bg-white border border-amber-200 rounded-lg overflow-hidden shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 min-w-0 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-amber-100 text-amber-950 border-amber-200">
              {tierLabel}
            </span>
            <span className="text-xs font-medium bg-amber-50 text-amber-900 px-2 py-0.5 rounded">
              {item.signalType}
            </span>
            <span className="text-xs text-slate-500">{item.source}</span>
            <span className="text-xs text-slate-500">strength {item.signalStrength}</span>
          </div>

          <h3 className="font-semibold text-slate-900">{item.title || 'Untitled demand signal'}</h3>
          {item.snippet && (
            <p className="text-sm text-slate-600 leading-snug line-clamp-3">{item.snippet}</p>
          )}
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-700 hover:underline break-all inline-block"
            >
              {item.sourceUrl}
            </a>
          )}

          <p className="text-sm text-brand-950 bg-brand-50/80 border border-brand-100 rounded px-3 py-2">
            Respond while intent is hot — create a prospect or match to an existing business, then
            start pursuit from the opportunity card.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <input
              className="border border-slate-300 rounded px-2 py-1"
              placeholder="Business name"
              value={draft.name}
              onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
            />
            <input
              className="border border-slate-300 rounded px-2 py-1"
              placeholder="Industry (optional)"
              value={draft.industry}
              onChange={(e) => onDraftChange({ ...draft, industry: e.target.value })}
            />
            <input
              className="border border-slate-300 rounded px-2 py-1"
              placeholder="City (optional)"
              value={draft.city}
              onChange={(e) => onDraftChange({ ...draft, city: e.target.value })}
            />
            <input
              className="border border-slate-300 rounded px-2 py-1"
              placeholder="Country (optional)"
              value={draft.country}
              onChange={(e) => onDraftChange({ ...draft, country: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <input
              className="border border-slate-300 rounded px-2 py-1 text-sm font-mono flex-1 min-w-[12rem]"
              placeholder="Match to business UUID"
              value={draft.businessId}
              onChange={(e) => onDraftChange({ ...draft, businessId: e.target.value })}
            />
            <button
              type="button"
              disabled={loading}
              onClick={onMatch}
              className="border border-slate-300 px-3 py-2 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Match
            </button>
          </div>
        </div>

        <div className="flex lg:flex-col items-center justify-center gap-2 p-4 lg:w-44 border-t lg:border-t-0 lg:border-l border-amber-100 bg-amber-50/30">
          <div className="text-center lg:mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Priority</p>
            <p className="text-3xl font-bold text-amber-700 tabular-nums">{priority}</p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onCreateProspect}
            className="w-full bg-brand-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            Create prospect
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onDismiss}
            className="w-full border border-slate-300 px-3 py-2 rounded-md text-sm hover:bg-white disabled:opacity-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </article>
  );
}
