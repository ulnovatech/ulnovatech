import { V1_CHARTER_SUMMARY } from '@/lib/product-copy';

export function V1CharterPanel() {
  return (
    <section className="mb-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
      <h3 className="font-semibold text-slate-900 mb-2">V1 product scope</h3>
      <p className="text-sm text-slate-700 mb-3">
        <span className="font-medium">ICP:</span> {V1_CHARTER_SUMMARY.icp}
      </p>
      <p className="text-sm text-slate-700 mb-3">
        <span className="font-medium">Workflow:</span> {V1_CHARTER_SUMMARY.workflow}
      </p>
      <p className="text-xs text-slate-500 mb-2">Out of scope for v1:</p>
      <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
        {V1_CHARTER_SUMMARY.nonGoals.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-3">
        Full charter: <code className="bg-white px-1 rounded">docs/V1_CHARTER.md</code>
      </p>
    </section>
  );
}
