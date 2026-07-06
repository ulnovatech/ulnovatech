import React, { useState } from 'react';
import { ProspectsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ImportProspects() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert('Select file');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await ProspectsAPI.importSpreadsheet(fd);
      alert('Inserted: ' + (res.inserted ?? 'unknown'));
      nav('/prospects');
    } catch (err) {
      alert(err.message || 'Import failed');
    }
    setLoading(false);
  }

  return (
    <div className="card p-6 max-w-2xl space-y-4">
      <h3 className="text-lg font-semibold text-white">Import prospects (CSV / XLSX)</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div className="text-sm text-muted space-y-2">
          <p>
            First row = headers. <strong>name</strong> is required. Optional: industry, location, source, priority
            (high|medium|low), notes, status (not_contacted|contacted|qualified), contacted_at.
          </p>
          <p>
            <strong>Discovery Intelligence handoff:</strong> export CSV from Demand Capture outreach (columns{' '}
            <code className="text-white/80">business</code>, <code className="text-white/80">email</code>,{' '}
            <code className="text-white/80">phone</code>, <code className="text-white/80">subject</code>,{' '}
            <code className="text-white/80">body</code>, <code className="text-white/80">maps_url</code>) —{' '}
            <code className="text-white/80">business</code> maps to name, outreach fields become notes, and{' '}
            <code className="text-white/80">source</code> defaults to Discovery Intelligence.
          </p>
          <p>
            <a
              href={`${import.meta.env.BASE_URL}templates/discovery-prospects-template.csv`}
              className="text-brand hover:underline"
              download
            >
              Download Discovery Intelligence import template
            </a>
          </p>
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
