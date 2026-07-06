'use client';

import Link from 'next/link';
import type { HunterHealth } from '@/lib/hunter-types';
import { cn } from '@/lib/utils';

type HunterSetupCardProps = {
  health: HunterHealth;
  className?: string;
};

type SetupStep = {
  done: boolean;
  label: string;
  optional?: boolean;
};

export function HunterSetupCard({ health, className }: HunterSetupCardProps) {
  if (health.ready) return null;

  const missingResearchKey = health.credentials.some(
    (c) => c.requiredFor === 'research' && !c.configured,
  );
  const missingComplaintsKey = health.credentials.some(
    (c) => c.requiredFor === 'complaints' && !c.configured,
  );
  const noPlatforms = !health.platforms.some((p) => p.enabled);
  const disabled = !health.enabled;

  const steps: SetupStep[] = [
    { done: health.enabled, label: 'Enable Market Hunter in Settings' },
    {
      done: !missingResearchKey,
      label: `Configure research API key (${health.settings.researchProvider}: ${health.settings.researchModel})`,
    },
    { done: !noPlatforms, label: 'Enable at least one platform to hunt' },
    {
      done: !missingComplaintsKey,
      label: `Configure complaints key for full gap cards (${health.settings.complaintsProvider})`,
      optional: true,
    },
  ];

  return (
    <div
      className={cn(
        'mb-6 rounded-xl border border-amber-600/40 bg-gradient-to-br from-amber-950/40 to-slate-900/60 p-5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1">
            Setup required
          </p>
          <h3 className="text-lg font-semibold text-amber-50">
            {disabled ? 'Market Hunter is off' : 'Almost ready to hunt'}
          </h3>
          {health.message && (
            <p className="text-sm text-slate-400 mt-1 max-w-xl">{health.message}</p>
          )}
        </div>
        <Link
          href="/settings"
          className="shrink-0 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-hunter-950 transition-colors"
        >
          Open Settings
        </Link>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.label}
            className={cn(
              'flex items-start gap-2 text-sm',
              step.done ? 'text-emerald-400/90' : 'text-slate-300',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                step.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400',
              )}
              aria-hidden
            >
              {step.done ? '✓' : '·'}
            </span>
            <span>
              {step.label}
              {step.optional && !step.done && (
                <span className="text-slate-500 ml-1">(optional for listing-only scans)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
