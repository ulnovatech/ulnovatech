'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type JobProgress = {
  runId: string;
  total: number;
  plannedTotal?: number;
  completed: number;
  completedInPlan?: number;
  failed: number;
  pending: number;
  running: number;
  currentStage: string | null;
  workerLastSeenAt?: string | null;
  workerStale?: boolean;
  jobs: Array<{
    id: string;
    stage: string;
    status: string;
    attempts: number;
    errorMessage: string | null;
    claimedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    durationMs: number | null;
    lastError: { message: string; at: string } | null;
  }>;
};

const STAGE_LABELS: Record<string, string> = {
  discover: 'Discover',
  resolve_accounts: 'Resolve accounts',
  crawl: 'Website crawl',
  bi_enrich: 'BI profile',
  derive_signals: 'Intent signals',
  score: 'Score leads',
  places_enrich: 'Places enrich',
  browser_enrich: 'Browser enrich',
};

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage;
}

function formatDuration(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function statusDot(status: string) {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'running') return 'bg-brand-500 animate-pulse';
  if (status === 'failed') return 'bg-red-500';
  return 'bg-slate-300';
}

export function RunProgress({
  runId,
  runStatus,
  detailed = false,
}: {
  runId: string;
  runStatus: string;
  detailed?: boolean;
}) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const isActive = runStatus === 'pending' || runStatus === 'running';

  useEffect(() => {
    if (!runId) return;

    let active = true;
    const poll = () =>
      api<JobProgress>(`/api/acquisition/jobs/${runId}`)
        .then((p) => {
          if (active) setProgress(p);
        })
        .catch(() => {});

    poll();
    if (!isActive) return () => {
      active = false;
    };

    const id = setInterval(poll, 2500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [runId, isActive]);

  if (!progress || (progress.total === 0 && !progress.plannedTotal)) return null;

  const percent = progress.plannedTotal
    ? Math.round(((progress.completedInPlan ?? 0) / progress.plannedTotal) * 100)
    : progress.total
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;
  const activeStage =
    progress.jobs.find((j) => j.status === 'running')?.stage ?? progress.currentStage;
  const failedJob = progress.jobs.find((j) => j.status === 'failed');
  const showWorkerWarning =
    isActive &&
    progress.workerStale !== false &&
    (progress.pending > 0 || progress.running > 0);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      {showWorkerWarning && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-xs">
          Job worker not detected. In a separate terminal run{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">pnpm jobs:worker</code> (or set{' '}
          <code className="font-mono bg-amber-100 px-1 rounded">INLINE_PIPELINE=true</code> for local
          dev only).
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-medium text-slate-800">
          Pipeline {percent}%
          {activeStage && isActive && (
            <span className="font-normal text-slate-600"> — {stageLabel(activeStage)}</span>
          )}
          {failedJob && runStatus === 'failed' && (
            <span className="font-normal text-red-700"> — failed at {stageLabel(failedJob.stage)}</span>
          )}
        </span>
        <span className="text-xs text-slate-500">
          {(progress.completedInPlan ?? progress.completed)}/
          {(progress.plannedTotal ?? progress.total)} stages
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${progress.failed > 0 ? 'bg-red-500' : 'bg-brand-600'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {!detailed && (
        <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs text-slate-600">
          {progress.jobs.map((j) => (
            <li key={j.id} className="flex items-center gap-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot(j.status)}`} />
              {stageLabel(j.stage)}
            </li>
          ))}
        </ul>
      )}
      {detailed && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-1.5 pr-3">Stage</th>
                <th className="py-1.5 pr-3">Status</th>
                <th className="py-1.5 pr-3">Duration</th>
                <th className="py-1.5 pr-3">Attempts</th>
                <th className="py-1.5">Error</th>
              </tr>
            </thead>
            <tbody>
              {progress.jobs.map((j) => (
                <tr key={j.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-1.5 pr-3 font-medium">{stageLabel(j.stage)}</td>
                  <td className="py-1.5 pr-3">
                    <span className="inline-flex items-center gap-1">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot(j.status)}`} />
                      {j.status}
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-slate-600">{formatDuration(j.durationMs)}</td>
                  <td className="py-1.5 pr-3 text-slate-600">{j.attempts}</td>
                  <td className="py-1.5 text-red-800 max-w-md truncate">
                    {j.lastError?.message ?? j.errorMessage ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
