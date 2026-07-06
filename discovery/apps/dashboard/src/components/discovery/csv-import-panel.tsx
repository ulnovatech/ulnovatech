'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CsvImportFileInfo } from '@agency/discovery';

type UploadResponse = {
  uploaded: boolean;
  rowCount: number;
  headers: string[];
  path: string;
  sizeBytes: number;
  fileName?: string;
};

async function fetchCsvStatus(): Promise<CsvImportFileInfo> {
  const res = await fetch('/api/discovery/csv', {
    headers: { 'X-Dev-User': 'operator' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to load CSV status');
  return data.csv as CsvImportFileInfo;
}

export function CsvImportPanel({ onUploaded }: { onUploaded?: () => void }) {
  const [info, setInfo] = useState<CsvImportFileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInfo(await fetchCsvStatus());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load CSV status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/discovery/csv/upload', {
        method: 'POST',
        headers: { 'X-Dev-User': 'operator' },
        body: form,
      });
      const data = (await res.json()) as UploadResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setSuccess(`Uploaded ${data.rowCount} row${data.rowCount === 1 ? '' : 's'}.`);
      await load();
      onUploaded?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">CSV lead file</h3>
          <p className="text-xs text-slate-500 mt-1">
            Import your own list — merged on each discovery run after Places and public search.
          </p>
        </div>
        <a
          href="/api/discovery/csv?template=1"
          className="text-xs text-brand-600 hover:underline shrink-0"
        >
          Download template
        </a>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Checking CSV file…</p>
      ) : (
        <div className="text-xs text-slate-600 mb-3 space-y-1">
          {info?.exists ? (
            <>
              <p>
                <span className="font-medium text-slate-800">{info.rowCount}</span> rows ·{' '}
                {info.valid ? (
                  <span className="text-green-700">ready</span>
                ) : (
                  <span className="text-amber-700">needs fix</span>
                )}
              </p>
              {info.lastModified && (
                <p className="text-slate-500">
                  Updated {new Date(info.lastModified).toLocaleString()}
                </p>
              )}
              {info.validationMessage && !info.valid && (
                <p className="text-amber-700">{info.validationMessage}</p>
              )}
            </>
          ) : (
            <p className="text-amber-700">No file uploaded yet — CSV import is inactive.</p>
          )}
        </div>
      )}

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border border-dashed border-slate-300 rounded-md p-4 text-center bg-slate-50"
      >
        <p className="text-sm text-slate-600 mb-2">Drop a .csv file here or choose a file</p>
        <label className="inline-block bg-white border border-slate-300 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
          {uploading ? 'Uploading…' : 'Choose CSV'}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
        <p className="text-xs text-slate-400 mt-2">Max 5MB · up to 10,000 rows</p>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2">
          {success}
        </p>
      )}
    </div>
  );
}
