'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type PipelineLogEntry = {
  at: string;
  level: 'info' | 'success' | 'error' | 'warn';
  stage?: string;
  message: string;
};

type JobProgress = {
  runId: string;
  total: number;
  plannedTotal: number;
  completed: number;
  completedInPlan: number;
  failed: number;
  pending: number;
  running: number;
  percent: number;
  currentStage: string | null;
  runningStage?: string | null;
  inlinePipeline?: boolean;
  runStatus?: string;
  workerLastSeenAt?: string | null;
  workerStale?: boolean;
  pipelineLog: PipelineLogEntry[];
  plannedStages: string[];
  jobs: Array<{
    id: string;
    stage: string;
    status: string;
    errorMessage: string | null;
    durationMs: number | null;
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

function levelClass(level: PipelineLogEntry['level']) {
  switch (level) {
    case 'success':
      return 'text-emerald-400';
    case 'error':
      return 'text-red-400';
    case 'warn':
      return 'text-amber-400';
    default:
      return 'text-slate-300';
  }
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage;
}

export function RunTerminal({
  runId,
  runStatus,
}: {
  runId: string | null;
  runStatus?: string;
}) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isActive = runStatus === 'pending' || runStatus === 'running';

  useEffect(() => {
    if (!runId) {
      setProgress(null);
      return;
    }

    let active = true;
    const poll = () =>
      api<JobProgress>(`/api/acquisition/jobs/${runId}`)
        .then((p) => {
          if (active) setProgress(p);
        })
        .catch(() => {});

    poll();
    if (!isActive && runStatus !== 'failed') return () => {
      active = false;
    };

    const id = setInterval(poll, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [runId, isActive, runStatus]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [progress?.pipelineLog?.length]);

  if (!runId) {
    return (
      <div className="mb-8 rounded-lg border border-slate-700 bg-slate-900 text-slate-500 font-mono text-xs p-4 min-h-[140px]">
        <p className="text-slate-400">Run process terminal</p>
        <p className="mt-2">Start a discovery run to stream pipeline logs here.</p>
      </div>
    );
  }

  const logs = progress?.pipelineLog ?? [];
  const showWorkerWarning =
    !progress?.inlinePipeline &&
    isActive &&
    progress?.workerStale !== false &&
    ((progress?.pending ?? 0) > 0 || (progress?.running ?? 0) > 0);

  const activeStage = progress?.runningStage ?? progress?.currentStage;

  return (
    <div className="mb-8 rounded-lg border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between gap-3 bg-slate-800 px-3 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>pipeline — {runId.slice(0, 8)}…</span>
          {progress && (
            <span className="text-slate-500">
              · {progress.percent}% · {progress.completedInPlan}/{progress.plannedTotal} stages
            </span>
          )}
        </div>
        {progress?.currentStage && isActive && (
          <span className="text-xs font-mono text-brand-300">
            {stageLabel(activeStage ?? progress.currentStage)}
            {progress.runningStage ? ' (running…)' : ''}
          </span>
        )}
      </div>

      {showWorkerWarning && (
        <div className="px-3 py-2 text-xs font-mono bg-amber-950 text-amber-300 border-b border-amber-900">
          Worker not detected — run <span className="text-amber-100">pnpm jobs:worker</span> or set{' '}
          <span className="text-amber-100">INLINE_PIPELINE=true</span>
        </div>
      )}

      <div
        ref={scrollRef}
        className="bg-slate-950 font-mono text-xs p-3 min-h-[180px] max-h-[320px] overflow-y-auto space-y-0.5"
      >
        {logs.length === 0 && (
          <p className="text-slate-500">Waiting for pipeline output…</p>
        )}
        {logs.map((entry, i) => (
          <div key={`${entry.at}-${i}`} className="flex gap-2 leading-relaxed">
            <span className="text-slate-600 shrink-0">{formatTime(entry.at)}</span>
            {entry.stage && (
              <span className="text-slate-500 shrink-0">[{stageLabel(entry.stage)}]</span>
            )}
            <span className={levelClass(entry.level)}>{entry.message}</span>
          </div>
        ))}
        {runStatus === 'completed' && logs.length > 0 && (
          <div className="flex gap-2 pt-1 text-emerald-400">
            <span className="text-slate-600 shrink-0">{formatTime(new Date().toISOString())}</span>
            <span>Run finished — view results in the table below.</span>
          </div>
        )}
        {runStatus === 'failed' && (
          <div className="flex gap-2 pt-1 text-red-400">
            <span className="text-slate-600 shrink-0">{formatTime(new Date().toISOString())}</span>
            <span>Run failed — check errors above or retry from run detail.</span>
          </div>
        )}
      </div>

      {progress && progress.plannedStages.length > 0 && (
        <div className="bg-slate-900 border-t border-slate-700 px-3 py-2 flex flex-wrap gap-2">
          {progress.plannedStages.map((stage) => {
            const job = progress.jobs.find((j) => j.stage === stage);
            const status = job?.status ?? 'waiting';
            const dot =
              status === 'completed'
                ? 'bg-emerald-500'
                : status === 'running'
                  ? 'bg-brand-400 animate-pulse'
                  : status === 'failed'
                    ? 'bg-red-500'
                    : status === 'pending'
                      ? 'bg-amber-400'
                      : 'bg-slate-600';
            return (
              <span
                key={stage}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {stageLabel(stage)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
