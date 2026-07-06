import React, { useState } from 'react';
import { CompetitorsAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ImportCompetitors() {
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
      const res = await CompetitorsAPI.importSpreadsheet(fd);
      alert('Inserted: ' + (res.inserted ?? 'unknown'));
      nav('/competitors');
    } catch (err) {
      alert(err.message || 'Import failed');
    }
    setLoading(false);
  }

  return (
    <div className="card p-6 max-w-2xl space-y-4">
      <h3 className="text-lg font-semibold text-white">Import competitors (CSV / XLSX)</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div className="text-sm text-muted space-y-2">
          <p>
            First row must be <strong>headers</strong>. <strong>name</strong> is required per row. Other columns are
            optional:
          </p>
          <p className="font-mono text-xs break-all">
            industry, description, website, threat_level (low|medium|high|critical), tags, strengths, weaknesses, mission,
            company_size, location, products_services, tech_stack, target_market, pricing_models, is_active
            (1/0/yes/no), notes
          </p>
          <p>
            For <strong>tags</strong>, <strong>strengths</strong>, <strong>weaknesses</strong> use commas or one item per
            line in a cell.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}
