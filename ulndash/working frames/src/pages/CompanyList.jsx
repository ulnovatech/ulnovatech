import React, { useEffect, useState } from 'react';
import { CompaniesAPI } from '../services/api';
import Filters from '../components/Filters';
import CompanyForm from '../components/CompanyForm';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';

export default function CompanyList(){
  const [filters, setFilters] = useState({ sort:'created_at', dir:'desc' });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page:1, per_page:25, total:0 });
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = { ...filters, page, per_page: meta.per_page };
      Object.keys(params).forEach(k=> { if (params[k]===''|| params[k]==null) delete params[k]; });
      const res = await CompaniesAPI.list(params);
      setRows(res.data || []);
      setMeta({ page: res.page || 1, per_page: res.per_page || 25, total: res.total || (res.data ? res.data.length : 0) });
    } catch (e) { alert(e.message); }
    setLoading(false);
  }
useEffect(() => {
  async function fetchCompanies() {
    await load(1);
  }
  fetchCompanies();
}, [filters]);

  async function handleSubmit(payload) {
    try {
      if (editing && editing.id) await CompaniesAPI.update(editing.id, payload);
      else await CompaniesAPI.create(payload);
      setOpenForm(false); setEditing(null); load(meta.page);
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this company?')) return;
    try { await CompaniesAPI.remove(id); load(meta.page); } catch (e) { alert(e.message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Companies</h2>
        <div className="flex gap-2">
          <button onClick={()=>{ setEditing(null); setOpenForm(true); }} className="px-3 py-2 bg-blue-600 text-white rounded">Add Company</button>
          <Link to="/import" className="px-3 py-2 bg-gray-100 rounded">Import CSV</Link>
        </div>
      </div>

      <Filters onChange={setFilters} initial={filters} />

      <div className="bg-white rounded-xl shadow overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Industry</th>
              <th className="p-3 text-left">Website</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Last Contact</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan="7" className="p-4 text-center">No companies</td></tr>}
            {!loading && rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium"><Link to={`/companies/${r.id}`} className="underline text-blue-600">{r.name}</Link></td>
                <td className="p-3">{r.industry || '-'}</td>
                <td className="p-3">{r.website_url ? <a href={r.website_url} target="_blank" rel="noreferrer" className="text-blue-600">Visit</a> : <span className="text-gray-400">No site</span>}</td>
                <td className="p-3">{r.location || '-'}</td>
                <td className="p-3"><StatusBadge value={r.status} /></td>
                <td className="p-3">{r.last_contact_date || '-'}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={()=>{ setEditing(r); setOpenForm(true); }} className="px-3 py-1 bg-gray-100 rounded">Edit</button>
                  <button onClick={()=>handleDelete(r.id)} className="px-3 py-1 bg-rose-600 text-white rounded">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center">
        <div>Total: <strong>{meta.total}</strong></div>
        <div className="flex items-center gap-2">
          <button onClick={()=> load(Math.max(1, meta.page-1))} className="px-3 py-1 bg-gray-100 rounded">Prev</button>
          <div>Page {meta.page} / {Math.max(1, Math.ceil(meta.total / meta.per_page))}</div>
          <button onClick={()=> load(meta.page+1)} className="px-3 py-1 bg-gray-100 rounded">Next</button>
        </div>
      </div>

      <CompanyForm open={openForm} initial={editing} onClose={()=>{ setOpenForm(false); setEditing(null); }} onSubmit={handleSubmit} />
    </div>
  );
}
