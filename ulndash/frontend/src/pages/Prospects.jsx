import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProspectsAPI } from '../services/api';
import ProspectStatusBadge from '../components/ProspectStatusBadge';
import EngageActions from '../components/EngageActions';
import ProspectFormModal from '../components/ProspectFormModal';
import ImportSpreadsheetButton from '../components/ImportSpreadsheetButton';

function PriorityDot({ p }) {
  const c =
    p === 'high' ? 'text-rose-400' : p === 'low' ? 'text-gray-500' : 'text-amber-300';
  return <span className={`text-xs font-medium capitalize ${c}`}>{p}</span>;
}

export default function Prospects() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, per_page: 25, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function loadStats() {
    try {
      setStats(await ProspectsAPI.stats());
    } catch (e) {
      console.error(e);
      setStats(null);
    }
  }

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = { page, per_page: meta.per_page, sort: 'created_at', dir: 'desc' };
      if (q.trim()) params.q = q.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await ProspectsAPI.list(params);
      setRows(res.data || []);
      setMeta({
        page: res.page || page,
        per_page: res.per_page || meta.per_page,
        total: res.total ?? 0,
      });
    } catch (e) {
      alert(e.message || 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    load(1);
  }, [q, statusFilter]);

  async function handleSubmit(payload) {
    if (editing?.id) {
      await ProspectsAPI.update(editing.id, payload);
    } else {
      await ProspectsAPI.create(payload);
    }
    setEditing(null);
    await loadStats();
    await load(meta.page);
  }

  async function setStatus(row, status) {
    try {
      await ProspectsAPI.update(row.id, { status });
      await loadStats();
      await load(meta.page);
    } catch (e) {
      alert(e.message || 'Update failed');
    }
  }

  async function handleConvert(row) {
    const website = window.prompt('Optional website URL for the new company record:', '');
    const payload = {};
    if (website && website.trim()) {
      payload.website_url = website.trim();
      payload.has_website = 1;
    }
    try {
      const res = await ProspectsAPI.convertToCompany(row.id, payload);
      if (res.company_id && window.confirm('Open the new company in Companies?')) {
        navigate(`/companies/${res.company_id}`);
      }
      await loadStats();
      await load(meta.page);
    } catch (e) {
      alert(e.message || 'Conversion failed');
    }
  }

  async function handleDelete(row) {
    if (!confirm(`Remove prospect “${row.name}”?`)) return;
    try {
      await ProspectsAPI.remove(row.id);
      await loadStats();
      await load(meta.page);
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  async function handleImport(fd) {
    try {
      const res = await ProspectsAPI.importSpreadsheet(fd);
      alert(`Imported ${res.inserted ?? 0} row(s).`);
      await loadStats();
      await load(1);
    } catch (e) {
      alert(e.message || 'Import failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Prospects</h2>
          <p className="text-sm text-muted mt-1">
            Cold-call list — move through contacted → qualified, then convert to a full company record.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium"
          >
            Add prospect
          </button>
          <ImportSpreadsheetButton label="Import CSV / XLSX" onUpload={handleImport} />
          <Link
            to="/import/prospects"
            className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 text-sm border border-gray-700 hover:bg-gray-700 inline-flex items-center"
          >
            Import page
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', v: stats?.total },
          { label: 'Not contacted', v: stats?.not_contacted },
          { label: 'Contacted', v: stats?.contacted },
          { label: 'Qualified', v: stats?.qualified },
          { label: 'Converted', v: stats?.converted },
          { label: 'Conversion %', v: stats?.conversion_rate_pct != null ? `${stats.conversion_rate_pct}%` : '—' },
        ].map((k) => (
          <div key={k.label} className="card p-3">
            <div className="text-xs text-muted">{k.label}</div>
            <div className="text-lg font-semibold text-white">{k.v ?? '—'}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Search name, notes, industry, source…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm min-w-[220px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white"
        >
          <option value="">All statuses</option>
          <option value="not_contacted">Not contacted</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="converted_to_company">Converted</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted border-b border-gray-800">
              <th className="p-3">Name</th>
              <th className="p-3">Industry</th>
              <th className="p-3">Location</th>
              <th className="p-3">Source</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
              <th className="p-3">Engage</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-muted">
                  No prospects. Add one or import a file — run the SQL migration if the table is missing.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-800/80 hover:bg-gray-900/40">
                  <td className="p-3 font-medium text-white">{r.name}</td>
                  <td className="p-3 text-gray-300">{r.industry || '—'}</td>
                  <td className="p-3 text-gray-400">{r.location || '—'}</td>
                  <td className="p-3 text-gray-400 max-w-[140px] truncate">{r.source || '—'}</td>
                  <td className="p-3">
                    <PriorityDot p={r.priority} />
                  </td>
                  <td className="p-3">
                    <ProspectStatusBadge status={r.status} />
                  </td>
                  <td className="p-3">
                    <EngageActions
                      phone={r.contact_phone || r.phone || null}
                      email={r.contact_email || r.email || null}
                      whatsapp={r.contact_whatsapp || r.contact_phone || r.phone || null}
                    />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <button
                        type="button"
                        className="px-2 py-1 text-xs rounded bg-gray-800 text-white"
                        onClick={() => {
                          setEditing(r);
                          setOpenForm(true);
                        }}
                      >
                        Edit
                      </button>
                      {r.status === 'not_contacted' && (
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded bg-sky-700 text-white"
                          onClick={() => setStatus(r, 'contacted')}
                        >
                          Mark contacted
                        </button>
                      )}
                      {r.status === 'contacted' && (
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded bg-amber-700 text-white"
                          onClick={() => setStatus(r, 'qualified')}
                        >
                          Mark qualified
                        </button>
                      )}
                      {r.status === 'qualified' && (
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded bg-emerald-700 text-white"
                          onClick={() => handleConvert(r)}
                        >
                          Convert to company
                        </button>
                      )}
                      {r.status === 'converted_to_company' && r.company_id && (
                        <Link
                          to={`/companies/${r.company_id}`}
                          className="px-2 py-1 text-xs rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                        >
                          Open company
                        </Link>
                      )}
                      {r.status !== 'converted_to_company' && (
                        <button
                          type="button"
                          className="px-2 py-1 text-xs rounded bg-rose-800 text-white"
                          onClick={() => handleDelete(r)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
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

      <ProspectFormModal
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
