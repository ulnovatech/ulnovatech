import { Suspense } from 'react';
import { DataQualityClient } from './data-quality-client';

export default function DataQualityPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading data quality…</p>}>
      <DataQualityClient />
    </Suspense>
  );
}
