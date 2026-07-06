import type { DiscoveryRunStats } from '@agency/discovery';

const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Google Maps',
  public_search: 'Public search',
  csv_import: 'CSV import',
  facebook: 'Facebook',
  instagram: 'Instagram',
};

function formatSource(source: string) {
  return SOURCE_LABELS[source] ?? source.replace(/_/g, ' ');
}

function formatPct(value: number | null) {
  if (value == null) return '—';
  return `${value}%`;
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function SourceBreakdown({
  title,
  counts,
}: {
  title: string;
  counts: Record<string, number>;
}) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <ul className="space-y-1 text-sm text-slate-700">
        {entries.map(([source, count]) => (
          <li key={source} className="flex justify-between gap-4">
            <span>{formatSource(source)}</span>
            <span className="font-medium tabular-nums">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RunYieldPanel({ stats }: { stats: DiscoveryRunStats }) {
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Run yield</h3>
        <div className="flex items-center gap-2">
          {stats.prospectFocus && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-brand-100 text-brand-800">
              Prospect focus
            </span>
          )}
          <p className="text-xs text-slate-500">
            Updated {new Date(stats.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        <StatCard
          label="Discovered"
          value={stats.candidatesDiscovered}
          hint="Candidates before resolve"
        />
        <StatCard
          label="Prospect signals"
          value={stats.prospectCandidates}
          hint={`${stats.highPotentialEstimate} high-potential estimate`}
        />
        <StatCard label="Saved" value={stats.accountsSaved} hint="Accounts in this run" />
        <StatCard
          label="Contactable"
          value={formatPct(stats.contactablePct)}
          hint={`${stats.contactable} with email or phone`}
        />
        <StatCard
          label="With website"
          value={formatPct(stats.websitePct)}
          hint={`${stats.withWebsite} businesses`}
        />
        <StatCard label="Crawled" value={stats.crawled} />
        <StatCard
          label="Scored ≥ min"
          value={stats.scoredAtOrAboveMin}
          hint={`${stats.scored} scored total`}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-sm">
        <SourceBreakdown title="Discovered by source" counts={stats.discoverBySource} />
        <SourceBreakdown title="Saved by source" counts={stats.savedBySource} />
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Funnel
          </p>
          <ul className="space-y-1 text-slate-700">
            <li className="flex justify-between gap-4">
              <span>Prospect saved</span>
              <span className="font-medium tabular-nums">{stats.prospectSaved}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Suppressed / skipped</span>
              <span className="font-medium tabular-nums">{stats.suppressedSkipped}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Email</span>
              <span className="font-medium tabular-nums">{stats.withEmail}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Phone</span>
              <span className="font-medium tabular-nums">{stats.withPhone}</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Reachability med+</span>
              <span className="font-medium tabular-nums">{stats.reachabilityMediumOrHigh}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
