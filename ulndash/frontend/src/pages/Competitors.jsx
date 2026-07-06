import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CompetitorsAPI } from '../services/api';
import ThreatBadge from '../components/ThreatBadge';
import CompetitorFormModal from '../components/CompetitorFormModal';
import ImportSpreadsheetButton from '../components/ImportSpreadsheetButton';

export default function Competitors() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 25, total: 0 });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [q, setQ] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function loadStats() {
    try {
      const s = await CompetitorsAPI.stats();
      setStats(s);
    } catch (e) {
      console.error('Competitor stats failed', e);
      setStats(null);
    }
  }

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = { page, per_page: meta.per_page, sort: 'created_at', dir: 'desc' };
      if (q.trim()) params.q = q.trim();
      const res = await CompetitorsAPI.list(params);
      setRows(res.data || []);
      setMeta({
        page: res.page || page,
        per_page: res.per_page || meta.per_page,
        total: res.total ?? 0,
      });
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to load competitors');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    load(1);
  }, [q]);

  async function handleSubmit(payload) {
    if (editing?.id) {
      await CompetitorsAPI.update(editing.id, payload);
    } else {
      await CompetitorsAPI.create(payload);
    }
    setEditing(null);
    await loadStats();
    await load(meta.page);
  }

  async function handleDelete(id) {
    if (!confirm('Remove this competitor from the list?')) return;
    try {
      await CompetitorsAPI.remove(id);
      await loadStats();
      await load(meta.page);
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  async function handleImport(formData) {
    try {
      const res = await CompetitorsAPI.importSpreadsheet(formData);
      alert(`Imported ${res.inserted ?? 0} competitor row(s).`);
      await loadStats();
      await load(1);
    } catch (e) {
      alert(e.message || 'Import failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Competition</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium"
          >
            Add competitor
          </button>
          <ImportSpreadsheetButton label="Import CSV / XLSX" onUpload={handleImport} />
          <Link
            to="/import/competitors"
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 text-sm border border-gray-700 hover:bg-gray-700 inline-flex items-center"
          >
            Import page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total competitors', value: stats?.total },
          { label: 'Active tracked', value: stats?.active_tracked },
          { label: 'New (last 30 days)', value: stats?.new_last_30d },
        ].map((k) => (
          <div key={k.label} className="card p-4 flex flex-col gap-1">
            <div className="text-sm text-muted">{k.label}</div>
            <div className="text-2xl font-semibold text-white kpi-value">{k.value ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search name, industry, description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm placeholder:text-gray-500 min-w-[240px]"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-gray-800">
              <th className="p-3">Name</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Threat</th>
              <th className="p-3">Website</th>
              <th className="p-3">Tags</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  No competitors yet. Add one or run the DB migration if the table is missing.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-800/80 hover:bg-gray-900/40">
                  <td className="p-3 font-medium">
                    <Link to={`/competitors/${r.id}`} className="text-indigo-400 hover:underline">
                      {r.name}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-300">{r.industry || '—'}</td>
                  <td className="p-3">
                    <ThreatBadge level={r.threat_level} />
                  </td>
                  <td className="p-3">
                    {r.website ? (
                      <a
                        href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="p-3 text-gray-400 max-w-[200px] truncate">
                    {Array.isArray(r.tags) && r.tags.length ? r.tags.join(', ') : '—'}
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <Link
                      to={`/competitors/${r.id}`}
                      className="px-2 py-1 text-xs rounded bg-gray-800 text-white inline-block"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(r);
                        setOpenForm(true);
                      }}
                      className="px-2 py-1 text-xs rounded bg-gray-700 text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="px-2 py-1 text-xs rounded bg-rose-700 text-white"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center text-sm">
        <div>
          Total: <strong>{meta.total}</strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(Math.max(1, meta.page - 1))}
            className="px-3 py-1 bg-gray-800 rounded"
            disabled={meta.page <= 1 || loading}
          >
            Prev
          </button>
          <span>
            Page {meta.page} / {Math.max(1, Math.ceil(meta.total / (meta.per_page || 1)))}
          </span>
          <button
            type="button"
            onClick={() => load(meta.page + 1)}
            className="px-3 py-1 bg-gray-800 rounded"
            disabled={loading || meta.page * meta.per_page >= meta.total}
          >
            Next
          </button>
        </div>
      </div>

      <CompetitorFormModal
        open={openForm}
        initial={editing}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
