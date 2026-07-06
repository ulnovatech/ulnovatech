'use client';

import type { BoIOpportunityBriefPayload } from '@agency/intelligence';
import { BOI_COPY } from '@/lib/product-copy';

function formatUgx(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount);
}

const GAP_SEVERITY_STYLES = {
  high: 'bg-red-50 text-red-900 border-red-100',
  medium: 'bg-amber-50 text-amber-900 border-amber-100',
  low: 'bg-slate-50 text-slate-700 border-slate-100',
} as const;

const READINESS_STYLES = {
  high: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  medium: 'bg-amber-100 text-amber-900 border-amber-200',
  low: 'bg-orange-100 text-orange-900 border-orange-200',
  unknown: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

const STATUS_STYLES = {
  ready: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partial: 'bg-amber-50 text-amber-900 border-amber-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

function evidenceById(
  evidence: BoIOpportunityBriefPayload['evidence'],
): Map<string, (typeof evidence)[number]> {
  return new Map(evidence.map((e) => [e.id, e]));
}

type OpportunityBriefPanelProps = {
  brief: BoIOpportunityBriefPayload;
  compact?: boolean;
};

export function OpportunityBriefPanel({ brief, compact = false }: OpportunityBriefPanelProps) {
  const sales = brief.salesBrief;
  const readiness = brief.purchaseReadiness;
  const evidenceMap = evidenceById(brief.evidence);

  const citedEvidence = (sales?.evidenceIds ?? [])
    .map((id) => evidenceMap.get(id))
    .filter(Boolean) as BoIOpportunityBriefPayload['evidence'];

  return (
    <section className="rounded-xl border border-violet-200 bg-white overflow-hidden shadow-sm">
      <header className="bg-gradient-to-r from-violet-50 to-brand-50/80 px-4 py-3 border-b border-violet-100">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900">{BOI_COPY.opportunityBrief}</h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded border ${STATUS_STYLES[brief.status]}`}
          >
            {BOI_COPY.status[brief.status]}
          </span>
          {sales?.opportunityType && (
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-brand-100 text-brand-900 border-brand-200">
              {sales.opportunityType}
            </span>
          )}
          {sales?.narrativeSource && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                sales.narrativeSource === 'llm'
                  ? 'bg-violet-100 text-violet-900 border-violet-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {BOI_COPY.narrativeSource[sales.narrativeSource]}
            </span>
          )}
          {readiness?.score != null && readiness.band && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${READINESS_STYLES[readiness.band]}`}
            >
              {BOI_COPY.purchaseReadiness} {readiness.score}/100 · {BOI_COPY.readinessBands[readiness.band]}
            </span>
          )}
        </div>
        {brief.status === 'partial' && (
          <p className="text-xs text-amber-800 mt-1.5">{BOI_COPY.partialNote}</p>
        )}
      </header>

      <div className="p-4 space-y-4">
        {sales?.executiveSummary && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              {BOI_COPY.executiveSummary}
            </p>
            <p className="text-sm text-slate-800 leading-relaxed">{sales.executiveSummary}</p>
          </div>
        )}

        {sales?.pitchAngle && (
          <div className="rounded-lg border border-brand-100 bg-brand-50/70 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-800 mb-0.5">
              {BOI_COPY.pitchAngle}
            </p>
            <p className="text-sm text-brand-950 leading-snug">{sales.pitchAngle}</p>
          </div>
        )}

        {brief.pains.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {BOI_COPY.topPains}
            </p>
            <ul className="space-y-2">
              {(compact ? brief.pains.slice(0, 2) : brief.pains.slice(0, 5)).map((pain) => {
                const excerpt = pain.evidenceIds
                  .map((id) => evidenceMap.get(id)?.excerpt)
                  .find(Boolean);
                return (
                  <li
                    key={pain.id}
                    className="rounded-lg border border-violet-100 bg-violet-50/50 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-violet-950">{pain.label}</p>
                      <span className="text-xs text-violet-700 tabular-nums">
                        {pain.confidence}% confidence
                      </span>
                    </div>
                    {!compact && excerpt && (
                      <p className="text-xs text-violet-900/80 mt-1 leading-snug italic">
                        &ldquo;{excerpt}&rdquo;
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!compact && brief.digitalGaps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {BOI_COPY.digitalGaps}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {brief.digitalGaps.map((gap) => (
                <span
                  key={gap.id}
                  className={`text-xs px-2 py-1 rounded border ${GAP_SEVERITY_STYLES[gap.severity]}`}
                  title={`${gap.confidence}% confidence`}
                >
                  {gap.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {(sales?.recommendedServices?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {BOI_COPY.recommendedServices}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sales!.recommendedServices.map((service) => (
                <span
                  key={service}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-100"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {!compact && brief.solutions.length > 0 && (
          <div className="space-y-2">
            {brief.solutions.slice(0, 3).map((solution) => (
              <div
                key={solution.id}
                className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-700"
              >
                <p className="font-medium text-slate-900">{solution.service}</p>
                {solution.benefits.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-slate-600 space-y-0.5">
                    {solution.benefits.slice(0, 2).map((b) => (
                      <li key={b.label}>{b.label}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {!compact && brief.sentimentSummary && (
          <div className="rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-3 space-y-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                {BOI_COPY.customerSentiment}
              </p>
              {brief.sentimentSummary.overallRating != null && (
                <span className="text-xs text-sky-900">
                  {brief.sentimentSummary.overallRating.toFixed(1)}★ ·{' '}
                  {brief.sentimentSummary.reviewCount} reviews
                </span>
              )}
            </div>
            {brief.sentimentSummary.praiseThemes.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-sky-700 mb-1">
                  {BOI_COPY.praiseThemes}
                </p>
                <ul className="space-y-1.5">
                  {brief.sentimentSummary.praiseThemes.slice(0, 3).map((theme) => (
                    <li key={theme.id} className="text-xs text-sky-950">
                      <span className="font-medium">{theme.label}</span>
                      <span className="text-sky-800"> · {theme.mentionCount} mention(s)</span>
                      {theme.sampleExcerpt && (
                        <p className="text-sky-900/80 mt-0.5 italic">&ldquo;{theme.sampleExcerpt}&rdquo;</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brief.sentimentSummary.complaintThemes.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800 mb-1">
                  {BOI_COPY.complaintThemes}
                </p>
                <ul className="space-y-1.5">
                  {brief.sentimentSummary.complaintThemes.slice(0, 3).map((theme) => (
                    <li key={theme.id} className="text-xs text-amber-950">
                      <span className="font-medium">{theme.label}</span>
                      <span className="text-amber-800"> · {theme.mentionCount} mention(s)</span>
                      {theme.sampleExcerpt && (
                        <p className="text-amber-900/80 mt-0.5 italic">&ldquo;{theme.sampleExcerpt}&rdquo;</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!compact && brief.techStack && brief.techStack.detected.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {BOI_COPY.techStack}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {brief.techStack.detected.map((item) => (
                <span
                  key={`${item.category}:${item.vendor}`}
                  className="text-xs px-2 py-1 rounded border bg-indigo-50 text-indigo-900 border-indigo-100"
                  title={`${item.category} · ${item.confidence} confidence`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {!compact && brief.projectValue && (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 mb-1">
              {BOI_COPY.projectValue}
            </p>
            <p className="text-sm font-semibold text-emerald-950">
              {formatUgx(brief.projectValue.minUgx)} – {formatUgx(brief.projectValue.maxUgx)}
            </p>
            <p className="text-xs text-emerald-800 mt-1 capitalize">{brief.projectValue.band} band</p>
            {brief.projectValue.factors.length > 0 && (
              <ul className="mt-2 text-xs text-emerald-900/90 list-disc list-inside space-y-0.5">
                {brief.projectValue.factors.slice(0, 4).map((factor) => (
                  <li key={factor}>{factor}</li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-emerald-700 mt-2 leading-snug">
              {BOI_COPY.projectValueDisclaimer}
            </p>
          </div>
        )}

        {!compact && brief.pageSpeed && (
          <div className="rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-800 mb-0.5">
              {BOI_COPY.pageSpeed}
            </p>
            <p className="text-sm font-semibold text-orange-950">
              {BOI_COPY.pageSpeedScore}: {brief.pageSpeed.performanceScore}/100
            </p>
            <p className="text-xs text-orange-800 mt-0.5 capitalize">{brief.pageSpeed.strategy} strategy</p>
          </div>
        )}

        {!compact && citedEvidence.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {BOI_COPY.evidence}
            </p>
            <ul className="space-y-1.5">
              {citedEvidence.map((ev) => (
                <li
                  key={ev.id}
                  className="text-xs text-slate-600 border-l-2 border-slate-200 pl-2 py-0.5"
                >
                  <span className="font-medium text-slate-800">{ev.label}</span>
                  {ev.excerpt && (
                    <span className="block text-slate-500 mt-0.5">{ev.excerpt}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export function OpportunityBriefPanelSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse space-y-3">
      <div className="h-5 bg-slate-100 rounded w-1/3" />
      <div className="h-16 bg-slate-100 rounded" />
      <div className="h-10 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

export function OpportunityBriefPanelEmpty({
  pipelineRunning,
}: {
  pipelineRunning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-700">{BOI_COPY.opportunityBrief}</p>
      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
        {pipelineRunning ? BOI_COPY.emptyRunning : BOI_COPY.emptyCompleted}
      </p>
    </div>
  );
}

export function OpportunityBriefPanelError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
      <p className="text-sm font-medium text-red-900">{BOI_COPY.errorLoad}</p>
      <p className="text-xs text-red-800 mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-xs font-medium text-red-800 underline hover:no-underline"
        >
          {BOI_COPY.retry}
        </button>
      )}
    </div>
  );
}
