import { OPERATING_KPI_TARGETS } from '@agency/settings/operating-kpis';
import Link from 'next/link';

export function KpiTargetsPanel() {
  return (
    <section className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-slate-900">V1 KPI targets</h3>
        <p className="text-sm text-slate-600 mt-1">
          Read-only targets from the operating model. Live values are on the{' '}
          <Link href="/ops" className="text-brand-700 hover:underline">
            Ops dashboard
          </Link>
          .
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-slate-600 border-b border-slate-200">
              <th className="py-2 pr-3 font-medium">KPI</th>
              <th className="py-2 pr-3 font-medium">Target</th>
              <th className="py-2 font-medium">Measurement</th>
            </tr>
          </thead>
          <tbody>
            {OPERATING_KPI_TARGETS.map((kpi) => (
              <tr key={kpi.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-3 text-slate-900">{kpi.label}</td>
                <td className="py-2 pr-3 text-slate-800 whitespace-nowrap">{kpi.target}</td>
                <td className="py-2 text-slate-600">{kpi.measurement}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        Full cadence and rules: <code className="text-slate-700">docs/OPERATING_MODEL.md</code>
      </p>
    </section>
  );
}
