// src/pages/Requests.jsx
import React, { useEffect, useState } from 'react';
import { fetchRequests } from '../services/requests';
import RequestFilter from '../components/RequestFilter';
import RequestTable from '../components/RequestTable';
import RequestDetails from '../components/RequestDetails';

export default function Requests() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page:1, per_page:25, total:0 });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: '', q: '', sort: 'submitted_at', dir: 'desc' });
  const [selected, setSelected] = useState(null);

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = { ...filters, page, per_page: meta.per_page };
      if (!params.type) delete params.type;
      if (!params.q) delete params.q;
      const res = await fetchRequests(params);
      // handle either {data, page, per_page, total} or plain array
      const data = res.data || res;
      setRows(data || []);
      setMeta({ page: res.page || page, per_page: res.per_page || meta.per_page, total: res.total || (Array.isArray(data) ? data.length : 0) });
    } catch (e) {
      console.error('Requests load failed', e);
      alert('Failed to load requests: ' + (e.message || e));
    } finally { setLoading(false); }
  }

useEffect(() => {
  let ignore = false; // optional cancellation flag

  async function fetchData() {
    try {
      if (!ignore) await load(1);
    } catch (e) {
      console.error(e);
    }
  }

  fetchData();

  return () => { ignore = true }; // cleanup just cancels state updates after unmount
}, [filters]);

  function handleRowClick(row) {
    setSelected(row);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Requests</h2>
        <div className="flex items-center gap-2">
          <RequestFilter value={filters} onChange={setFilters} />
        </div>
      </div>

      <div className="card">
        <RequestTable rows={rows} loading={loading} onRowClick={handleRowClick} />
      </div>

      <div className="flex justify-between items-center">
        <div>Total: <strong>{meta.total}</strong></div>
        <div className="flex items-center gap-2">
          <button onClick={() => load(Math.max(1, meta.page-1))} className="px-3 py-1 bg-gray-800 rounded">Prev</button>
          <div>Page {meta.page} / {Math.max(1, Math.ceil(meta.total / meta.per_page || 1))}</div>
          <button onClick={() => load(meta.page+1)} className="px-3 py-1 bg-gray-800 rounded">Next</button>
        </div>
      </div>

      {selected && <RequestDetails item={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}
