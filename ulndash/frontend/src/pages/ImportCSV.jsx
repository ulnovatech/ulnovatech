import React, { useState } from 'react';
import { CompaniesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function ImportCSV() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return alert('Select file');
    setLoading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await CompaniesAPI.importSpreadsheet(fd);
      alert('Inserted: ' + (res.inserted ?? 'unknown'));
      nav('/companies');
    } catch (err) { alert(err.message || 'Import failed'); }
    setLoading(false);
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
      <h3 className="text-lg font-semibold mb-3">Import companies (CSV / XLSX)</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept=".csv,.xlsx,.xlsm,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <div className="text-sm text-gray-500">
          First row must be headers. Supported: <strong>.csv</strong>, <strong>.xlsx</strong>. Columns: name (required),
          industry, website_url, website, has_website, location, contact_person, contact_method, status, priority,
          last_contact_date, notes
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Uploading...' : 'Upload'}</button>
        </div>
      </form>
    </div>
  );
}
